# the steps and flags used to build Git on macOS
rm -rf /tmp/build/git/*
pushd ~/src/git
git checkout v2.11.0
make clean
DESTDIR='/tmp/build/git' make install prefix=/ NO_PERL=1 NO_TCLTK=1 NO_GETTEXT=1 NO_DARWIN_PORTS=1 NO_INSTALL_HARDLINKS=1 MACOSX_DEPLOYMENT_TARGET=10.9
popd
pushd /tmp/build/git/
zip -q -r -9 -y Git-2.11.0-macOS-9.zip .
popd
