# the steps and flags used to build Git on macOS
rm -rf /tmp/build/git/*
make clean
DESTDIR='/tmp/build/git' make install prefix=/ NO_TCLTK=1 NO_GETTEXT=1 NO_DARWIN_PORTS=1 NO_CROSS_DIRECTORY_HARDLINKS=1 NO_INSTALL_HARDLINKS=1