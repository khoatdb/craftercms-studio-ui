/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function () {

  function Receptacles(id, form, properties, constraints) {
    this.id = id;
    this.form = form;
    this.properties = properties;
    this.constraints = constraints;
    this.selectItemsCount = -1;
    this.type = '';
    this.allowShared = false;
    this.allowEmbedded = false;
    this.defaultEnableBrowseExisting = false;
    this.defaultEnableSearchExisting = false;
    this.baseRepoPath = '/site/components';
    this.baseBrowsePath = '/site/components';
    //this.countOptions = 0;
    const i18n = CrafterCMSNext.i18n;
    this.formatMessage = i18n.intl.formatMessage;
    this.messages = i18n.messages.receptaclesMessages;

    properties.forEach(prop => {
      if (prop.value) {
        this[prop.name] = prop.value;
      }
    });

    console.log(properties);
    return this;
  }

  Receptacles.prototype = {
    itemsAreContentReferences: true,

    createElementAction: function (control, _self, addContainerEl) {
      // if(this.countOptions > 1) {
      //   control.addContainerEl = null;
      //   control.containerEl.removeChild(addContainerEl);
      // }
      // if (_self.type === "") {
      //   CStudioAuthoring.Operations.createNewContent(
      //     CStudioAuthoringContext.site,
      //     _self.processPathsForMacros(_self.repoPath),
      //     false, {
      //       success: function (formName, name, value) {
      //         control.insertItem(value, formName.item.internalName, null, null, _self.id);
      //         control._renderItems();
      //       },
      //       failure: function () {
      //       }
      //     }, true);
      // } else {
      //   CStudioAuthoring.Operations.openContentWebForm(
      //     _self.type,
      //     null,
      //     null,
      //     _self.processPathsForMacros(_self.repoPath),
      //     false,
      //     false,
      //     {
      //       success: function (contentTO, editorId, name, value) {
      //         control.insertItem(name, value, null, null, _self.id);
      //         control._renderItems();
      //         CStudioAuthoring.InContextEdit.unstackDialog(editorId);
      //       },
      //       failure: function () {
      //       }
      //     },
      //     [
      //       { name: "childForm", value: "true"}
      //     ]);
      // }
    },

    browseExistingElementAction: function (control, _self, addContainerEl) {
      // if(this.countOptions > 1) {
      //   control.addContainerEl = null;
      //   control.containerEl.removeChild(addContainerEl);
      // }
      // // if the browsePath property is set, use the property instead of the repoPath property
      // // otherwise continue to use the repoPath for both cases for backward compatibility
      // var browsePath = _self.repoPath;
      // if (_self.browsePath != undefined && _self.browsePath != '') {
      //   browsePath = _self.browsePath;
      // }
      // CStudioAuthoring.Operations.openBrowse("", _self.processPathsForMacros(browsePath), _self.selectItemsCount, "select", true, {
      //   success: function (searchId, selectedTOs) {
      //     for (var i = 0; i < selectedTOs.length; i++) {
      //       var item = selectedTOs[i];
      //       var value = (item.internalName && item.internalName != "") ? item.internalName : item.uri;
      //       control.insertItem(item.uri, value, null, null, _self.id);
      //       control._renderItems();
      //     }
      //   },
      //   failure: function () {
      //   }
      // });
    },

    searchExistingElementAction: function (control, _self, addContainerEl) {
      // if (this.countOptions > 1) {
      //   control.addContainerEl = null;
      //   control.containerEl.removeChild(addContainerEl);
      // }
      //
      // var searchContext = {
      //   searchId: null,
      //   itemsPerPage: 12,
      //   keywords: "",
      //   filters: {},
      //   sortBy: "internalName",
      //   sortOrder: "asc",
      //   numFilters: 1,
      //   filtersShowing: 10,
      //   currentPage: 1,
      //   searchInProgress: false,
      //   view: 'grid',
      //   lastSelectedFilterSelector: '',
      //   mode: "select"              // open search not in default but in select mode
      // };
      //
      // CStudioAuthoring.Operations.openSearch(searchContext, true, {
      //   success(searchId, selectedTOs) {
      //     selectedTOs.forEach (function(item) {
      //       var value = (item.internalName && item.internalName !== "") ? item.internalName : item.uri;
      //       control.insertItem(item.uri, value, null, null, _self.id);
      //       control._renderItems();
      //     });
      //   },
      //   failure: function () {
      //   }
      // }, searchContext.searchId);
    },

    add: function (control, onlyAppend) {
      const self = this;
      console.log(onlyAppend);
      console.log(control.addContainerEl);

      if (this.contentTypes) {
        this.contentTypes.split(',').forEach(contentType => {
          self._createContentTypesControls(contentType, $(control.addContainerEl), self.messages);
        });
      }


      // const $addContainerEl = $('<div class="cstudio-form-control-node-selector-add-container"></div>');
      //$(control.containerEl).append($addContainerEl);

      // var CMgs = CStudioAuthoring.Messages;
      // var langBundle = CMgs.getBundle("contentTypes", CStudioAuthoringContext.lang);
      //
      // var _self = this;
      //
      // var addContainerEl = control.addContainerEl ? control.addContainerEl : null;
      //
      // var datasourceDef = this.form.definition.datasources,
      //   newElTitle = '';
      //
      // for(var x = 0; x < datasourceDef.length; x++){
      //   if (datasourceDef[x].id === this.id){
      //     newElTitle = datasourceDef[x].title;
      //   }
      // }
      //
      // if (!addContainerEl && (this.countOptions > 1 || onlyAppend)) {
      //   addContainerEl = document.createElement("div");
      //   control.containerEl.appendChild(addContainerEl);
      //   YAHOO.util.Dom.addClass(addContainerEl, 'cstudio-form-control-node-selector-add-container');
      //   control.addContainerEl = addContainerEl;
      //   control.addContainerEl.style.left = control.addButtonEl.offsetLeft + "px";
      //   control.addContainerEl.style.top = control.addButtonEl.offsetTop + 22 + "px";
      // }
      //
      // if (this.enableCreateNew || this.defaultEnableCreateNew) {
      //   if(this.countOptions > 1 || onlyAppend) {
      //     addContainerEl.create = document.createElement("div");
      //     addContainerEl.appendChild(addContainerEl.create);
      //     YAHOO.util.Dom.addClass(addContainerEl.create, 'cstudio-form-controls-create-element');
      //
      //     var createEl = document.createElement("div");
      //     YAHOO.util.Dom.addClass(createEl, 'cstudio-form-control-node-selector-add-container-item');
      //     createEl.innerHTML = CMgs.format(langBundle, "createNew") + " - " + newElTitle;
      //     control.addContainerEl.create.appendChild(createEl);
      //     var addContainerEl = control.addContainerEl;
      //     YAHOO.util.Event.on(createEl, 'click', function () {
      //       _self.createElementAction(control, _self, addContainerEl);
      //     }, createEl);
      //   }else{
      //     _self.createElementAction(control, _self);
      //   }
      //
      // }
      //
      // if (this.enableBrowseExisting || this.defaultEnableBrowseExisting) {
      //   if(this.countOptions > 1 || onlyAppend) {
      //     addContainerEl.browse = document.createElement("div");
      //     addContainerEl.appendChild(addContainerEl.browse);
      //     YAHOO.util.Dom.addClass(addContainerEl.browse, 'cstudio-form-controls-browse-element');
      //
      //     var browseEl = document.createElement("div");
      //     browseEl.innerHTML = CMgs.format(langBundle, "browseExisting") + " - " + newElTitle;
      //     YAHOO.util.Dom.addClass(browseEl, 'cstudio-form-control-node-selector-add-container-item');
      //     control.addContainerEl.browse.appendChild(browseEl);
      //     var addContainerEl = control.addContainerEl;
      //     YAHOO.util.Event.on(browseEl, 'click', function () {
      //       _self.browseExistingElementAction(control, _self, addContainerEl);
      //     }, browseEl);
      //   }else{
      //     _self.browseExistingElementAction(control, _self);
      //   }
      // }
      //
      // if (this.enableSearchExisting || this.defaultEnableSearchExisting) {
      //   if (this.countOptions > 1) {
      //     addContainerEl.search = document.createElement("div");
      //     addContainerEl.appendChild(addContainerEl.search);
      //     YAHOO.util.Dom.addClass(addContainerEl.search, 'cstudio-form-controls-search-element');
      //
      //     var searchEl = document.createElement("div");
      //     searchEl.innerHTML = CMgs.format(langBundle, "searchExisting") + " - " + newElTitle;
      //     YAHOO.util.Dom.addClass(searchEl, 'cstudio-form-control-node-selector-add-container-item');
      //     control.addContainerEl.search.appendChild(searchEl);
      //     var addContainerEl = control.addContainerEl;
      //     YAHOO.util.Event.on(searchEl, 'click', function () {
      //       _self.searchExistingElementAction(control, _self, addContainerEl);
      //     }, searchEl);
      //   } else {
      //     _self.searchExistingElementAction(control, _self);
      //   }
      // }

    },

    edit: function (key, control) {
      // var _self = this;
      // CStudioAuthoring.Service.lookupContentItem(CStudioAuthoringContext.site, key, {
      //   success: function(contentTO) {
      //     CStudioAuthoring.Operations.editContent(
      //       contentTO.item.contentType,
      //       CStudioAuthoringContext.siteId,
      //       contentTO.item.uri,
      //       contentTO.item.nodeRef,
      //       contentTO.item.uri,
      //       false,
      //       {
      //         success: function(contentTO, editorId, name, value) {
      //           if(control){
      //             control.updateEditedItem(value, _self.id);
      //             CStudioAuthoring.InContextEdit.unstackDialog(editorId);
      //           }
      //         }
      //       });
      //   },
      //   failure: function() {}
      // });
    },

    updateItem: function (item, control) {
      // if(item.key && item.key.match(/\.xml$/)){
      //   var getContentItemCb = {
      //     success: function(contentTO) {
      //       item.value =  contentTO.item.internalName || item.value;
      //       control._renderItems();
      //     },
      //     failure: function() {
      //     }
      //   }
      //
      //   CStudioAuthoring.Service.lookupContentItem(CStudioAuthoringContext.site, item.key, getContentItemCb);
      // }
    },

    getLabel: function () {
      return this.formatMessage(this.messages.receptacles);
    },

    getInterface: function () {
      return 'item';
    },

    getName: function () {
      return 'receptacles';
    },

    getSupportedProperties: function () {
      return [
        {
          label: this.formatMessage(this.messages.allowShared),
          name: 'allowShared',
          type: 'boolean',
          defaultValue: 'true'
        },
        {
          label: this.formatMessage(this.messages.allowEmbedded),
          name: 'allowEmbedded',
          type: 'boolean',
          defaultValue: 'true'
        },
        {
          label: this.formatMessage(this.messages.enableBrowse),
          name: 'enableBrowse',
          type: 'boolean',
          defaultValue: 'false'
        },
        {
          label: this.formatMessage(this.messages.enableSearch),
          name: 'enableSearch',
          type: 'boolean',
          defaultValue: 'false'
        },
        {
          label: this.formatMessage(this.messages.baseRepositoryPath),
          name: 'baseRepositoryPath',
          type: 'string',
          defaultValue: '/site/components'
        },
        {
          label: this.formatMessage(this.messages.baseBrowsePath),
          name: 'baseBrowsePath',
          type: 'string',
          defaultValue: '/site/components'
        },
        { label: this.formatMessage(this.messages.contentTypes), name: 'contentTypes', type: 'contentTypes' },
        { label: this.formatMessage(this.messages.tags), name: 'tags', type: 'string' }
      ];
    },

    getSupportedConstraints: function () {
      return [];
    },

    _createContentTypesControls(contentType, $addContainerEl, messages) {
      const self = this;

      function createOption(message, type) {
        let $option = $(`
            <div class="cstudio-form-control-node-selector-add-container-item">
              ${message} ${contentType}
            </div>
          `);
        $option.on('click', function () {
          //self._openContentTypeForm(contentType, type);
        });
        return $option;
      }

      if (self.allowEmbedded) {
        $addContainerEl.append(createOption(self.formatMessage(messages.createNewEmbedded), 'embedded'));
      }
      if (self.allowShared) {
        $addContainerEl.append(createOption(self.formatMessage(messages.createNewShared), 'shared'));
      }
    },

    _openContentTypeForm(contentType, type) {
      const self = this;
      if (type === 'shared') {
        const path = `/site/components/${contentType.replace(/\//g, '_').substr(1)}`;
        CStudioAuthoring.Operations.openContentWebForm(
          contentType,
          null,
          null,
          path,
          false,
          false,
          {
            success: function (contentTO, editorId, name, value) {
              self.newInsertItem(name, value, type);
              self._renderItems();
              CStudioAuthoring.InContextEdit.unstackDialog(editorId);
            },
            failure: function () {
            }
          },
          [
            { name: 'childForm', value: 'true' }
          ]);
      } else {

      }
      console.log(contentType);
    },

  };

  CStudioAuthoring.Module.moduleLoaded('cstudio-forms-controls-receptacles', Receptacles);
})();
