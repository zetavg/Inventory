type Fetch = (url: string | Request, opts?: RequestInit) => Promise<Response>;

export type AirtableRecord = {
  id?: string;
  fields: { [key: string]: unknown };
};

export type AirtableField = {
  id?: string;
  name: string;
  description?: string;
} & (
  | {
      type: 'singleLineText';
    }
  | {
      type: 'multilineText';
    }
  | {
      type: 'number';
      options: {
        precision: number;
      };
    }
  | {
      type: 'dateTime';
      options: {
        timeZone: string;
        dateFormat: {
          name: string;
        };
        timeFormat: {
          name: string;
        };
      };
    }
  | {
      type: 'url';
    }
  | { type: 'multipleAttachments' }
  | {
      type: 'checkbox';
      options: {
        color: string;
        icon: string;
      };
    }
  | {
      type: 'singleSelect';
      options: {
        choices: Array<{ id: string; name: string }>;
      };
    }
  | {
      type: 'multipleRecordLinks';
      options: {
        linkedTableId: string;
        isReversed?: boolean;
        prefersSingleRecordLink?: boolean;
      };
    }
  | {
      type: 'formula';
      options: {
        formula: string;
      };
    }
);

export type AirtableTable = {
  id?: string;
  name: string;
  description: string;
  primaryFieldId?: string;
  fields: Array<AirtableField>;
};

export class AirtableAPIError extends Error {
  type: string;
  errorMessage: string;

  constructor(error: unknown) {
    var errorMessage = `Unknown Error: ${JSON.stringify(error)}`;
    var type = 'UNKNOWN';
    if (
      error &&
      typeof error === 'object' &&
      typeof (error as any).type === 'string' &&
      typeof (error as any).message === 'string'
    ) {
      type = (error as any).type;
      errorMessage = (error as any).message;
    }

    super(`${type} - ${errorMessage}`);
    this.type = type;
    this.errorMessage = errorMessage;

    // Set the prototype explicitly to ValidationError, to make instanceof work
    Object.setPrototypeOf(this, AirtableAPIError.prototype);
  }
}

export default class AirtableAPI {
  public listBases: () => Promise<{
    bases: Array<{ id: string; name: string }>;
  }>;
  public getBaseSchema: (baseId: string) => Promise<{
    tables: Array<AirtableTable>;
  }>;
  public createBase: (params: {
    name: string;
    tables: Array<AirtableTable>;
    workspaceId: string;
  }) => Promise<{
    id: string;
    tables: Array<AirtableTable>;
  }>;
  public createField: (
    baseId: string,
    tableId: string,
    field: AirtableField,
  ) => Promise<AirtableField>;
  public updateField: (
    baseId: string,
    tableId: string,
    columnId: string,
    field: AirtableField,
  ) => Promise<AirtableField>;
  public listRecords: (
    baseId: string,
    tableId: string,
    options?: {
      pageSize?: number;
      offset?: string;
      sort?: ReadonlyArray<{ field: string; direction: 'asc' | 'desc' }>;
      fields?: ReadonlyArray<string>;
    },
  ) => Promise<{
    offset?: string;
    records: ReadonlyArray<{ id: string; fields: { [key: string]: unknown } }>;
  }>;
  public getRecord: (
    baseId: string,
    tableId: string,
    recordId: string,
  ) => Promise<{ id: string; fields: { [key: string]: unknown } }>;
  public createRecords: (
    baseId: string,
    tableId: string,
    data: { records: ReadonlyArray<{ fields: { [key: string]: any } }> },
  ) => Promise<{
    records: ReadonlyArray<{ id: string; fields: { [key: string]: unknown } }>;
  }>;
  public updateRecords: (
    baseId: string,
    tableId: string,
    data: {
      records: ReadonlyArray<{ id: string; fields: { [key: string]: any } }>;
    },
  ) => Promise<{
    records: ReadonlyArray<{ id: string; fields: { [key: string]: unknown } }>;
  }>;
  public deleteRecords: (
    baseId: string,
    tableId: string,
    recordIds: ReadonlyArray<string>,
  ) => Promise<{
    records: ReadonlyArray<{ id: string; deleted: boolean }>;
  }>;

  private fetch: Fetch;
  private isFetching: boolean;
  private fetchWithRateLimit: Fetch;
  private lastFetchTime: number | undefined;
  private accessToken: string;

  private onApiCall: undefined | (() => void);

  constructor({
    accessToken,
    fetch,
    onApiCall,
  }: {
    accessToken: string;
    fetch: Fetch;
    onApiCall?: () => void;
  }) {
    this.accessToken = accessToken;
    this.fetch = fetch;
    this.onApiCall = onApiCall;

    this.isFetching = false;
    // Airtable API has a rate limit of 5 requests per second.
    this.fetchWithRateLimit = async (...args) => {
      while (this.isFetching) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      this.isFetching = true;

      try {
        const now = Date.now();
        const timeFromLastFetch = now - (this.lastFetchTime || 0);
        if (timeFromLastFetch < 210) {
          await new Promise(resolve =>
            setTimeout(resolve, 210 - timeFromLastFetch),
          );
        }

        this.lastFetchTime = Date.now();

        let retries = 0;
        while (true) {
          try {
            if (this.onApiCall) this.onApiCall();
            const resp = await this.fetch(...args);
            if (resp.status === 429 || resp.status >= 500) {
              throw new Error(await resp.text());
            }

            return resp;
          } catch (e) {
            retries += 1;
            if (retries > 5) throw e;

            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } finally {
        this.isFetching = false;
      }
    };

    this.listBases = async () => {
      const res = await this.fetchWithRateLimit(
        'https://api.airtable.com/v0/meta/bases',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );
      const json = await res.json();
      if (json.error) {
        throw new AirtableAPIError(json.error);
      }
      return json;
    };

    this.getBaseSchema = async (baseId: string) => {
      const res = await this.fetchWithRateLimit(
        `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );
      const json = await res.json();
      if (json.error) {
        throw new AirtableAPIError(json.error);
      }
      return json;
    };

    this.createBase = async params => {
      const res = await this.fetchWithRateLimit(
        'https://api.airtable.com/v0/meta/bases',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        },
      );
      const json = await res.json();
      if (json.error) {
        throw new AirtableAPIError(json.error);
      }
      return json;
    };

    // this.updateTable = async (baseId, tableIdOrName, fieldId, field) => {
    //   const res = await this.fetchWithRateLimit(
    //     `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields/${fieldId}`,
    //     {
    //       method: 'PATCH',
    //       headers: {
    //         Authorization: `Bearer ${this.accessToken}`,
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify(field),
    //     },
    //   );
    //   const json = await res.json();
    //   if (json.error) {
    //     throw new AirtableAPIError(json.error);
    //   }
    //   return json;
    // };

    this.createField = async (baseId, tableId, field) => {
      const res = await this.fetchWithRateLimit(
        `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(field),
        },
      );
      const json = await res.json();
      if (json.error) {
        throw new AirtableAPIError(json.error);
      }
      return json;
    };
    this.updateField = async (baseId, tableId, fieldId, field) => {
      const res = await this.fetchWithRateLimit(
        `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields/${fieldId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(field),
        },
      );
      const json = await res.json();
      if (json.error) {
        throw new AirtableAPIError(json.error);
      }
      return json;
    };

    this.listRecords = async (baseId, tableId, options) => {
      const res = await this.fetchWithRateLimit(
        `https://api.airtable.com/v0/${baseId}/${tableId}/listRecords`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        },
      );
      const json = await res.json();
      if (json.error) {
        throw new AirtableAPIError(json.error);
      }
      return json;
    };
    this.getRecord = async (baseId, tableId, recordId) => {
      const res = await this.fetchWithRateLimit(
        `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );
      const json = await res.json();
      if (json.error) {
        throw new AirtableAPIError(json.error);
      }
      return json;
    };

    this.createRecords = async (baseId, tableId, records) => {
      const res = await this.fetchWithRateLimit(
        `https://api.airtable.com/v0/${baseId}/${tableId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(records),
        },
      );
      const json = await res.json();
      if (json.error) {
        throw new AirtableAPIError(json.error);
      }
      return json;
    };

    this.updateRecords = async (baseId, tableId, records) => {
      const res = await this.fetchWithRateLimit(
        `https://api.airtable.com/v0/${baseId}/${tableId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(records),
        },
      );
      const json = await res.json();
      if (json.error) {
        throw new AirtableAPIError(json.error);
      }
      return json;
    };

    this.deleteRecords = async (baseId, tableId, recordIds) => {
      if (recordIds.length > 1) {
        const res = await this.fetchWithRateLimit(
          `https://api.airtable.com/v0/${baseId}/${tableId}?${recordIds
            .map(id => `records=${id}`)
            .join('&')}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          },
        );
        const json = await res.json();
        if (json.error) {
          throw new AirtableAPIError(json.error);
        }
        return json;
      } else {
        const res = await this.fetchWithRateLimit(
          `https://api.airtable.com/v0/${baseId}/${tableId}/${recordIds[0]}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          },
        );
        const json = await res.json();
        if (json.error) {
          throw new AirtableAPIError(json.error);
        }
        return { records: [json] };
      }
    };
  }
}
