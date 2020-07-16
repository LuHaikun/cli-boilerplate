#!/bin/bash

npm run build

scp -r ./.docz/dist/* root@192.168.5.118:/root/www/cli # ip 为服务器ip地址；directory 为部署目录