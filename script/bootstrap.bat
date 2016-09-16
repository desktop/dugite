ECHO OFF

:: install pre-requisites so everything can be built
CALL npm install typescript@rc
CALL npm install rimraf
CALL npm install tslint

:: build the artefacts needed so that install works
CALL npm run build

:: install everything else
CALL npm install
