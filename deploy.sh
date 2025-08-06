#!/bin/bash

cd ~/vitepress
npm run docs:build
if [ $? -eq 0 ]; then
    echo "build success"
    sudo cp -r .vitepress/dist /var/www/html
    sudo /etc/init.d/nginx reload
else 
    echo "build failed"
fi    
