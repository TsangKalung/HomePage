# while the github action breaks,use this to deploy
set -e

npm run build

cd public

git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:TsangKalung/TsangKalung.github.io.git master

cd -