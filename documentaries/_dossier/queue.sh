#!/bin/sh
# runs the remaining renders one after another
D=/home/user/build-your-own/documentaries
until grep -q "BUILD EXIT" $D/ant-dossier/out-build.log; do sleep 20; done
(sh $D/goat-cliffs/build.sh > $D/goat-cliffs/out-build.log 2>&1; echo "BUILD EXIT $?" >> $D/goat-cliffs/out-build.log)
for p in bee-kingdom goat-cliffs ant-dossier; do (sh $D/$p/build-v.sh > $D/$p/out-build-v.log 2>&1; echo "BUILD EXIT $?" >> $D/$p/out-build-v.log); done
echo QUEUE DONE
