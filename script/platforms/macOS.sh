# the steps and flags used to build Git on macOS
make configure
# this becomes the output directory rather than trying to install it into $HOME
./configure --prefix=/Users/shiftkey/build/git/
NO_R_TO_GCC_LINKER=1 NO_INSTALL_HARDLINKS=1 NO_FINK=1 NO_DARWIN_PORTS=1 NO_TCLTK=1 make install
