These were built in EC2:

```
sudo yum install clang
sudo yum install git

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm install 16

git clone https://github.com/decentralized-identity/ion-tools.git
cd ion-tools/
npm install -g browserify
npm install esmify --save-dev
npm run build
```

The files end up in `dist`.

Why? Because otherwise the Rollup toolchain will do a terrible job trying to pull the Node ION module into web-land.
