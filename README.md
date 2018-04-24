# JSONomy datasource manager
manage JSONomy datasources ( view items, edit items, set icon images, view result in map, get API links, ... )
git repo to create a JSONomy datasource https://github.com/TonyFord/JSONomy_datasource.git

### Use cases
* create/manage databases for maps ( http://umap.openstreetmap.fr/ )
* create/manage data objects for websites

### Requirements
* Webbrowser
* no further requirements
* local and remote possible

### Dependencies
* jQuery 1.11.2
* Bootstrap4x
* http://umap.openstreetmap.fr/  ( optional )


### Installation

Follow the steps below to create a own datasource.
This project **doesn't contain the datasource itself** but the editor to manage one or more datasources.

To create a datasource please install the JSONomy_datasource.


### Installation - step 1

clone this git repo

    git clone https://github.com/TonyFord/JSONomy_datasource_manager.git

OR download the zip and extract

    https://github.com/TonyFord/JSONomy_datasource_manager/archive/master.zip

### Installation - step 2

Add the url of (external) datasources. Set the property autoselect : true if you want select this source by load of editor.

    [
      {
        "source":"http://fairplayground.info/datasources/FCLN",
        "autoselect": false
      }
    ]
