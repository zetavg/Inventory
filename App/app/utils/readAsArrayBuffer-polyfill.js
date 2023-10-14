import { atob } from 'react-native-quick-base64';

FileReader.prototype.readAsArrayBuffer = function (blob) {
  if (this.readyState === this.LOADING) throw new Error('InvalidStateError');
  this._setReadyState(this.LOADING);
  this._result = null;
  this._error = null;
  const fr = new FileReader();
  fr.onloadend = () => {
    const content = atob(
      fr.result.substr('data:application/octet-stream;base64,'.length),
    );
    const buffer = new ArrayBuffer(content.length);
    const view = new Uint8Array(buffer);
    view.set(Array.from(content).map(c => c.charCodeAt(0)));
    this._result = buffer;
    this._setReadyState(this.DONE);
  };
  fr.readAsDataURL(blob);
};
