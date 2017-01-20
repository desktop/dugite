# the steps and flags used to build Git on Ubuntu
pushd ~/src/git
git checkout v2.11.0
rm -rf /tmp/build/git/*
make clean
DESTDIR='/tmp/build/git' make install prefix=/ NO_PERL=1 NO_TCLTK=1 NO_GETTEXT=1 USE_LIBPCRE=1 NO_OPENSSL=1 NO_CROSS_DIRECTORY_HARDLINKS=1 NO_INSTALL_HARDLINKS=1 CC='gcc' CFLAGS='-Wall -g -O2 -fstack-protector --param=ssp-buffer-size=4 -Wformat -Werror=format-security -D_FORTIFY_SOURCE=2' LDFLAGS='-Wl,-Bsymbolic-functions -Wl,-z,relro'
popd
pushd /tmp/build/git/
zip -q -r Git-2.11.0-ubuntu-8.zip .
popd
