#!/bin/sh
# This is a helper script for the zarafa-webapp Debian package. It takes
# the given upstream source, extract the tarball, # filtering out some unusal
# files or directories and repack it into new file which can be procssed
# with git-buildpackage for importing a new upstream source.
#
# (C) 2015, Carsten Schoenert <c.schoenert@t-online.de>
# Licensed under the terms of GPLv2 or later.

# We have to filter out some files and directorys from the upstream source.
FILTER="\
client/jquery/jquery-1.6.2.min.js \
client/tinymce/plugins/media/moxieplayer.swf \
plugins/files/js/external/uxmediapak.js \
plugins/files/resources/flash/player.swf \
plugins/xmpp/jsjac \
server/PEAR/JSON.php \
tools/resources/ext-doc/template/ext/resources/ext-base.js \
tools/resources/ext-doc/template/ext/resources/ext-all.js \
tools/resources/ext-doc/template/dot/resources/ext-base.js \
tools/resources/ext-doc/template/dot/resources/ext-all.js \
tools/resources/ext-doc/template/ext/resources/prettify/prettify.js \
tools/resources/ext-doc/template/dot/resources/prettify/prettify.js \
"
OPTIONS="--sign-tags --verbose"

SRCPKG="zarafa-webapp"
TMPDIR=$(mktemp --tmpdir=/tmp -d)/

EXIT_SUCCESS=0
EXIT_FAILURE=1

CURDIR_FULL=`pwd`
CURDIR=$(basename `pwd`)

usage () {
cat << EOF

Usage: ${0##*/} FILE

    [FILE]  The upstream source file from Zarafa named like
            'webapp-VERSION.SVN_ID.tar.gz'.

EOF
}

# check if we are inside ${SRCPKG} and have a git environment
if [ "${CURDIR}" != "${SRCPKG}" ]; then
    echo "Not in ${SRCPKG}/.."
    exit ${EXIT_FAILURE}
else
    if [ ! -d .git ]; then
        echo "no directory .git/ found! You are in the correct directory?"
        exit ${EXIT_FAILURE}
    fi
fi

# we have no options found?
if [ $(($#)) -lt 1 ]; then
    echo "You need to add the upstream file!" >&2
    usage
	exit ${EXIT_FAILURE}
fi

cd ${TMPDIR}
tar -xzf $1
# getting directory there the source is exctracted
SOURCEDIR=`ls -D . | grep *webapp*`
NAME=`echo ${SOURCEDIR%.*} | awk -F "-" '{print $1}'`
VERSION=`echo ${SOURCEDIR%.*} | awk -F "-" '{print $2}'`
FINALNAME="${NAME}_${VERSION}"

echo "renaming '${SOURCEDIR}' to '${FINALNAME}'"
mv ${SOURCEDIR} ${FINALNAME}
echo "now removing files and directories"
echo
cd ${FINALNAME}
for TO_REMOVE in ${FILTER}; do
    echo "   filter out: ${TO_REMOVE}" && rm -rf ${TO_REMOVE}
done
echo
cd ..

# creating tarball
echo "creating tarball '${SRCPKG}_${VERSION}.orig.tar.xz' from directory '${FINALNAME}'"
tar -Jcf ${SRCPKG}_${VERSION}.orig.tar.xz ${FINALNAME}

#moving the tarball back
echo "moving tarball to ${CURDIR_FULL}/.."
mv ${SRCPKG}_${VERSION}.orig.tar.xz ${CURDIR_FULL}/..
cd ${CURDIR_FULL} && ls -lah ../${SRCPKG}_${VERSION}.orig.tar.xz

# cleanup /tmp
rm -rf ${TMPDIR}

exit ${EXIT_SUCCESS}
