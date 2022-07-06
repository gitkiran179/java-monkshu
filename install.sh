#!/bin/bash

JAVA_MONKSHU_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

mkdir -p monkshu/backend/apps

echo -e "\n...............CREATING SYMLINKS...............\n"

ln -s $JAVA_MONKSHU_DIR/rsjava/backend/apps/rsjava/ $JAVA_MONKSHU_DIR/monkshu/backend/apps/rsjava
ln -s $JAVA_MONKSHU_DIR/dbmagic/backend/apps/dbmagic/ $JAVA_MONKSHU_DIR/monkshu/backend/apps/dbmagic

echo -e "\n..............SYMLINKS CREATED...................\n"

echo -e "\n...........NPM MODULES INSTALL...............\n"
npm install -y mustache java oracledb

    
echo -e "\n............THIRD PARTY DEPENDENCIES..........\n"

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=linux;wget https://download.oracle.com/otn_software/linux/instantclient/216000/instantclient-basic-linux.x64-21.6.0.0.0dbru.zip;;
    Darwin*)    machine=darwin;wget https://download.oracle.com/otn_software/mac/instantclient/198000/instantclient-basic-macos.x64-19.8.0.0.0dbru.zip;;
esac

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=linux;archive=instantclient-basic-linux.x64-21.6.0.0.0dbru.zip;folder=instantclient_21_6;;
    Darwin*)    machine=darwin;archive=instantclient-basic-macos.x64-19.8.0.0.0dbru.zip;folder=instantclient_19_8;;
esac

unzip "$archive"

mkdir -p $JAVA_MONKSHU_DIR/dbmagic/backend/apps/dbmagic/3p/${machine}/oracle_instantclient/

mv "$folder"/* "dbmagic/backend/apps/dbmagic/3p/"${machine}"/oracle_instantclient/"
rmdir "$folder"
rm -rf "$archive"
