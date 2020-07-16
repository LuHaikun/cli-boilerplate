export default configs => {
  return `
    server {
      listen ${configs.port};
      charset utf-8;

      client_max_body_size 75M;

      location / {
      root ${configs.path};
      add_header 'Access-Control-Allow-Origin' '*';
      index index.html;
      }
    }
  `
}
