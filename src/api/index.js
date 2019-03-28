/* 处理http请求config */
import axios from 'axios';
import {getLocalData} from '../assets/js/cache';
import api01 from './api';
import router from '../router/index'
let domainUrl = 'http://api.hhtdlng.com/bpm';
/* 接口超时时长设置 */
let timeout = 60000;


const errorState = function(error) {
  let errorMsg = '';
  if (error && error.response) {
    switch (error.response.status) {
      case 400:
        errorMsg = '参数错误';
        break;
      case 401:
        errorMsg = '未授权或登录过期，请重新登录';
        break;
      case 403:
        errorMsg = '拒绝访问';
        break;
      case 404:
        errorMsg = '请求出错(404)';
        break;
      case 405:
        errorMsg = '拒绝访问(405)';
        break;
      case 408:
        errorMsg = '请求超时，请检查网络';
        break;
      case 500:
        errorMsg = '服务器错误(500)';
        break;
      case 501:
        errorMsg = '服务未实现(501)';
        break;
      case 502:
        errorMsg = '网络错误(502)';
        break;
      case 503:
        errorMsg = '服务不可用(503)';
        break;
      case 504:
        errorMsg = '网络超时(504)';
        break;
      case 505:
        errorMsg = 'HTTP版本不受支持(505)';
        break;
      default:
        errorMsg = `连接出错(${error.response.status})!`;
    }
  }else if(error.code === 'ECONNABORTED'){
    errorMsg = '接口超时，请检查网络再刷新重试!'
  } else {
    errorMsg = '连接服务器失败!'
  }
  if(!axios.isCancel(error)){//如果是主动取消，则不报错误信息，（在切换路由的时候会主动取消请求）
    Message.error(errorMsg);
  }
  if(error && error.response && error.response.status === 401){
    router.push({ path: "/login" });
  }
}

/* 根据后端接口文档统一处理错误信息 */
const successState = function(response) {

  if (response.data && response.data.code) {
    if (response.data.code == 401) {
      Message.error('登录过期，请重新登录');
      router.push({ path: "/login" });
    } else if (response.data.code == 403) {
      Message.error('无操作权限');
    } else if (response.data.code == 0) {

    } else {
      if (response.data.msg) {
        Message.error(response.data.msg);
      }
    }
  }

}

/* 处理url */
const dealApiUrlParam = function (apiName, postData) {
  let httpUrl = api01[apiName].url;

  if (httpUrl) {
    //设置最大循环数,以免死机
    let maxTimes = 0;
    while (httpUrl.match(/:([0-9a-z_]+)/i)) {
      let tempV = RegExp.$1;
      maxTimes++;
      //httpUrl最大支持10个变量替换
      if (maxTimes > 10) break;
      let reg = new RegExp(":" + tempV, "ig");
      if (postData.hasOwnProperty(tempV)) {
        httpUrl = httpUrl.replace(reg, postData[tempV])
        delete postData[tempV];
      }
    }
  }
  return httpUrl;
};

const dealConfig01 = function (apiName, postData) {

  const httpConfig = {
    method: '',
    baseURL: domainUrl,
    url: '',
    timeout: timeout,
    params: '',
    data: postData,
    headers: '',
  }

  if (api01.hasOwnProperty(apiName)) {
    let apiUrl = api01[apiName].url ? api01[apiName].url : '';
    let method = api01[apiName].method ? api01[apiName].method.toLowerCase() : '';
    let token = getLocalData('token', true);
    httpConfig.method = method;

    if (method == 'get') {
      httpConfig.headers = {
        'X-Requested-With': 'XMLHttpRequest',
        "Accept": "application/json",
        "Content-Type": "application/json; charset=UTF-8"
      }
    } else {
      httpConfig.headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json; charset=UTF-8'
      }
    }

    if (!api01[apiName].notNeedToken) {
      httpConfig.headers.Authorization = 'jwt ' + token;
    }

    if (apiUrl) {
      apiUrl = dealApiUrlParam(apiName, postData);
    } else {
      return false
    }

    if (method == 'get' || method == 'delete') {
      delete httpConfig.data
    }

    if (method) {
      if ((method == 'get' || method == 'delete') && (postData && typeof postData === 'object')) {
        //如果接口为 get 请求，但是参数需要用？跟随，这是需要的对应处理
        let params = '?';
        let existedVars = {};
        for (let t in postData) {
          if (!existedVars.hasOwnProperty(t)) {
            params += t + "=" + encodeURIComponent(postData[t]) + '&';
          }
        }
        if (params.match(/^(.+)&$/i)) {
          params = RegExp.$1;
          apiUrl += params;
        }
      }
      httpConfig.url = apiUrl;
      return httpConfig;
    } else {
      return false
    }

  } else {
    return false;
  }

};


/* http请求统一函数 */
export const httpServer01 = (apiName, postData, defaultSuccessCallback, defaultErrorCallback) => {

  if (!apiName) return false;

  let httpConfig = dealConfig01(apiName, postData);

  let promise01 = new Promise(function (resolve, reject) {
    axios(httpConfig).then(
      (res) => {
        //默认使用successState
        if (defaultSuccessCallback === undefined) {
          successState(res)
        } else if (typeof defaultSuccessCallback === 'function') {
          defaultSuccessCallback(res);
        }
        resolve(res)
      }
    ).catch(
      (response) => {
        //默认使用errorState
        if (defaultErrorCallback === undefined) {
          errorState(response)
        } else if (typeof defaultErrorCallback === 'function') {
          defaultErrorCallback(response);
        }
        reject(response)
      }
    )

  })
  return promise01
}
