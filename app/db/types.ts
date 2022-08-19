export type DBContent = {
  a: any;
};

export type AttachmentDBContent = {
  filename: string;
  thumbnail128?: string;
  thumbnail64?: string;
  content_type: string;
  data: string;
  dimensions?: {
    width: number;
    height: number;
  };
  timestamp?: string;
};
