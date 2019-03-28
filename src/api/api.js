const api01 = {
  login01: {
    url: '/api/v1/auth/login/',
    method: 'post',
    notNeedToken: true,
    desc: '登录',
    param: {
      username: {
        desc: '用户名'
      },
      password: {
        desc: '密码'
      }
    }
  },
  searchCustomerList01: {
    url: '/api/v1/consumer/',
    method: 'get',
    desc: '获取客户列表',
    param: {

    }
  },
  getCustomerDetlil01: {
    url: '/api/v1/consumer/:id/',
    method: 'get',
    desc: '获取客户详情',
    param: {

    }
  }
}

export default api01
