import React, { useRef } from 'react';
const Client = require('snappy-pdf-api').Client

export default (user) => {
  const client = useRef(new Client(user)).current
  client.setUser(user)
  return client
}

