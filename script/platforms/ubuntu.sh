make configure
./configure --prefix=/home/shiftkey/build/git
V=1 NO_R_TO_GCC_LINKER=1 NO_INSTALL_HARDLINKS=1 NO_TCLTK=1 CC="-static" make install
