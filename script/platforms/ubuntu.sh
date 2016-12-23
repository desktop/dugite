make clean
DESTDIR='/home/shiftkey/build/git' make install prefix=/ NO_TCLTK=1 NO_GETTEXT=1 USE_LIBPCRE=1 NO_CROSS_DIRECTORY_HARDLINKS=1 NO_INSTALL_HARDLINKS=1 V=1 CC='gcc' CFLAGS='-Wall -g -O2 -fstack-protector --param=ssp-buffer-size=4 -Wformat -Werror=format-security -D_FORTIFY_SOURCE=2' LDFLAGS='-Wl,-Bsymbolic-functions -Wl,-z,relro'
