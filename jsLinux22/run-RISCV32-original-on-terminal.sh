echo " -------------------------------------"
echo "   Type in on a DIFFERENT terminal:"
echo " node run-SERVER-on-localhost:8082.js "
echo " ...and run this script again! "
echo " -------------------------------------"
echo " If localhost:8082 is in use, type in:"
echo "         npx kill-port 8082 "
echo "  to run this script succesfully ..."
echo " -------------------------------------"

# forever run-web-SERVER-on-localhost:8082.js
# nohup node run-web-SERVER-on-localhost:8082.js &
./tinyemu-2018-09-23/temu buildroot-riscv32-1.cfg

