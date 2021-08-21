import axios from 'axios';
import { post, getErrorMsg } from './axios';

export const getPresignedUrl = (file, onSuccess, onError) => {
  const data = { filename: file.name, mime: file.type }
  post("/api/documents/presigned", data, onSuccess, onError);
}

export const uploadFile = (file, presignedUrl, onProgress, onSuccess, onError) => {
  console.log(file.type)
  axios({
    method: 'put',
    url: presignedUrl,
    data: file,
    headers: {'Content-Type': file.type },
    onUploadProgress: (progressEvent) => {
      const { total, loaded } = progressEvent;
      const percentComplete = Math.ceil(loaded/total * 100);
      return onProgress(percentComplete);
    },
  }).then(response => {
    onSuccess(response.data)
  }).catch(error => {
    console.log(error)
    const errorMsg = getErrorMsg(error);
    onError(errorMsg);
  });
}
