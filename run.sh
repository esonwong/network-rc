sudo wget -O /tmp/network-rc.tar.gz https://network-rc.esonwong.com/download/network-rc.tar.gz

tar -zxf /tmp/network-rc.tar.gz -C ~/

sudo systemctl start network-rc.service
