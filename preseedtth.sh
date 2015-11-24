cat *.xml | grep File | cut -d'=' -f2,4 | cut -d'"' -f 1-2,3-5 | sed -e 's; Size=;, ;' -e 's;/>;;' | sort | uniq

