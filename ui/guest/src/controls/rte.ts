/*
 * Copyright (C) 2007-2022 Crafter Software Corporation. All Rights Reserved.
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

import { ElementRecord } from '../models/InContextEditing';
import * as iceRegistry from '../iceRegistry';
import { Editor } from 'tinymce';
import * as contentController from '../contentController';
import { ContentTypeFieldValidations } from '@craftercms/studio-ui/models/ContentType';
import { post, message$ } from '../utils/communicator';
import { GuestStandardAction } from '../store/models/GuestStandardAction';
import { Observable, Subject } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { reversePluckProps } from '@craftercms/studio-ui/utils/object';
import { showEditDialog, snackGuestMessage } from '@craftercms/studio-ui/state/actions/preview';
import { RteSetup } from '../models/Rte';
import { editComponentInline, exitComponentInlineEdit } from '../store/actions';
import { emptyFieldClass } from '../constants';
import { rtePickerActionResult, showRtePickerActions } from '@craftercms/studio-ui/state/actions/dialogs';
import { filter, take } from 'rxjs/operators';

export function initTinyMCE(
  path: string,
  record: ElementRecord,
  validations: Partial<ContentTypeFieldValidations>,
  rteSetup?: RteSetup
): Observable<GuestStandardAction> {
  const dispatch$ = new Subject<GuestStandardAction>();
  const { field, model } = iceRegistry.getReferentialEntries(record.iceIds[0]);
  const type = field?.type;
  const inlineElsRegex =
    /^(B|BIG|I|SMALL|TT|ABBR|ACRINYM|CITE|CODE|DFN|EM|KBD|STRONG|SAMP|VAR|A|BDO|BR|IMG|MAP|OBJECT|Q|SCRIPT|SPAN|SUB|SUP|BUTTON|INPUT|LABEL|SELECT|TEXTAREA)$/;
  let rteEl = record.element;
  const isRecordElInline = record.element.tagName.match(inlineElsRegex);

  // If record element is of type inline (doesn't matter the display prop), replace it with a block element (div).
  // This is because of an issue happening with inline elements (for example a span tag even with 'display: block' style
  // was still causing an issue, and also for example a div element with 'display: inline' doesn't present the issue).
  // https://github.com/craftercms/craftercms/issues/5212
  if (isRecordElInline) {
    const recordEl = record.element;
    const blockEl = document.createElement('div');
    blockEl.innerHTML = recordEl.innerHTML;

    /*
     * Get and copy only the inline styles (from the 'style' prop) of the element. If we want to retrieve all the styles
     * (inline styles and styles applied from css files, etc.) we would use `window.getComputedStyle(element)`, but
     * that may cause an issue because all the styles would become inline styles and have higher precedence than other
     * styles (for example styles applied by XB).
     * */
    const inlineStyles = recordEl.style;
    blockEl.style.cssText = Array.from(inlineStyles).reduce((str, property) => {
      return `${str}${property}:${inlineStyles.getPropertyValue(property)};`;
    }, '');

    // Copy original element className
    blockEl.className = recordEl.className;
    blockEl.style.display = 'inline-block';

    blockEl.style.minHeight = recordEl.offsetHeight + 'px';
    blockEl.style.minWidth = '10px';
    rteEl = blockEl;

    // Hide original element
    recordEl.style.display = 'none';
    recordEl.parentNode.insertBefore(rteEl, recordEl);
  }

  const openEditForm = () => {
    post({
      type: showEditDialog.type,
      payload: {
        selectedFields: [field.id]
      }
    });
  };

  const controlPropsMap = {
    enableSpellCheck: 'browser_spellcheck',
    forceRootBlockPTag: 'forced_root_block'
  };
  const controlProps = {};
  Object.keys(controlPropsMap).forEach((key) => {
    if (field.properties?.[key]) {
      const propKey = controlPropsMap[key];
      controlProps[propKey] = field.properties[key].value;
    }
  });

  const external: { [id: string]: string } = {
    ...rteSetup?.tinymceOptions?.external_plugins,
    acecode: '/studio/static-assets/js/tinymce-plugins/ace/plugin.min.js',
    editform: '/studio/static-assets/js/tinymce-plugins/editform/plugin.js',
    craftercms_paste_extension: '/studio/static-assets/js/tinymce-plugins/craftercms_paste_extension/plugin.js'
  };

  record.element.classList.remove(emptyFieldClass);

  window.tinymce.init({
    target: rteEl,
    promotion: false,
    // Templates plugin is deprecated but still available on v6, since it may be used, we'll keep it. Please
    // note that it will become premium on version 7.
    deprecation_warnings: false,
    // For some reason this is not working.
    // body_class: 'craftercms-rich-text-editor',
    plugins: ['editform', rteSetup?.tinymceOptions?.plugins].filter(Boolean).join(' '), // 'editform' plugin will always be loaded
    paste_as_text: type !== 'html',
    paste_data_images: type === 'html',
    paste_preprocess(plugin, args) {
      window.tinymce.activeEditor.plugins.craftercms_paste_extension?.paste_preprocess(plugin, args);
    },
    paste_postprocess(plugin, args) {
      window.tinymce.activeEditor.plugins.craftercms_paste_extension?.paste_postprocess(plugin, args);
    },
    toolbar: type === 'html',
    forced_root_block: type === 'html',
    menubar: false,
    inline: true,
    base_url: '/studio/static-assets/libs/tinymce',
    suffix: '.min',
    external_plugins: external,
    code_editor_inline: false,
    skin: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oxide-dark' : 'oxide',
    media_live_embeds: true,
    file_picker_types: 'image media',
    craftercms_paste_cleanup: rteSetup?.tinymceOptions?.craftercms_paste_cleanup ?? true, // If doesn't exist or if true => true
    file_picker_callback: function (cb, value, meta) {
      // meta contains info about type (image, media, etc). Used to properly add DS to dialogs.
      // meta.filetype === 'file | image | media'
      const datasources = {};
      Object.values(field.validations).forEach((validation) => {
        if (
          ['allowImageUpload', 'allowImagesFromRepo', 'allowVideoUpload', 'allowVideosFromRepo'].includes(validation.id)
        ) {
          datasources[validation.id] = validation;
        }
      });
      const browseBtn = document.querySelector('.tox-dialog .tox-browse-url');

      post(
        showRtePickerActions({
          datasources,
          model,
          type: meta.filetype,
          rect: browseBtn.getBoundingClientRect()
        })
      );

      message$
        .pipe(
          filter((e) => e.type === rtePickerActionResult.type),
          take(1)
        )
        .subscribe(({ payload }) => {
          if (payload) {
            cb(payload.path, { alt: payload.name });
          }
        });
    },
    setup(editor: Editor) {
      let changed = false;
      let originalContent;
      let pluginManager = window.tinymce.util.Tools.resolve('tinymce.PluginManager');

      function save() {
        const content = getContent();
        // 'change' event is not triggering until focusing out in v6. Reported in here https://github.com/tinymce/tinymce/issues/9132
        if (changed || content !== originalContent) {
          contentController.updateField(record.modelId, record.fieldId[0], record.index, content);
        }
      }

      function getContent() {
        return type === 'html' ? editor.getContent() : editor.getContent({ format: 'text' });
      }

      function getSelectionContent() {
        return type === 'html' ? editor.selection.getContent() : editor.selection.getContent({ format: 'text' });
      }

      function destroyEditor() {
        editor.destroy(false);
      }

      function cancel({ saved }: { saved: boolean }) {
        const content = getContent();
        destroyEditor();

        // In case the user did some text bolding or other formatting which won't
        // be honoured on plain text, revert the content to the edited plain text
        // version of the input.
        changed && type === 'text' && (record.element.innerHTML = content);

        if (isRecordElInline) {
          // Update original element and remove created blockElement
          record.element.innerHTML = rteEl.innerHTML;
          rteEl.remove();
          record.element.style.display = '';
        }

        if (record.element.innerHTML.trim() === '') {
          record.element.classList.add(emptyFieldClass);
        }

        // The timeout prevents clicking the edit menu to be shown when clicking out of an RTE
        // with the intention to exit editing.
        setTimeout(() => {
          dispatch$.next(exitComponentInlineEdit({ path, saved }));
          dispatch$.complete();
          dispatch$.unsubscribe();
        }, 150);
      }

      editor.on('init', function () {
        originalContent = getContent();

        editor.focus(false);
        editor.selection.select(editor.getBody(), true);
        editor.selection.collapse(false);

        // In some cases the 'blur' event is getting caught somewhere along
        // the way. Focusout seems to be more reliable.
        editor.on('focusout', (e) => {
          let saved = false;
          let relatedTarget = e.relatedTarget as HTMLElement;
          if (
            !relatedTarget?.closest('.tox-tinymce') &&
            !relatedTarget?.classList.contains('tox-dialog__body-nav-item')
          ) {
            if (validations?.required && !getContent().trim()) {
              post(
                snackGuestMessage({
                  id: 'required',
                  level: 'required',
                  values: { field: record.label }
                })
              );
              editor.setContent(originalContent);
            } else {
              // Replace new line char which is not honoured if the field is not html type
              if (type !== 'html') {
                editor.setContent(getContent().replace(/\n+/g, ' '));
              }
              if (getContent() !== originalContent) {
                saved = true;
                save();
              }
            }
            e.stopImmediatePropagation();
            cancel({ saved });
          }
        });

        editor.once('change', () => {
          changed = true;
        });

        editor.once('external_change', () => {
          changed = true;
        });

        if (type !== 'html') {
          // For plain text fields, remove keyboard shortcuts for formatting text
          // meta is used in tinymce for Ctrl (PC) and Command (macOS)
          // https://www.tiny.cloud/docs/advanced/keyboard-shortcuts/#editorkeyboardshortcuts
          editor.addShortcut('meta+b', '', '');
          editor.addShortcut('meta+i', '', '');
          editor.addShortcut('meta+u', '', '');
        }
      });

      // TODO: The max-length can be bypassed by pasting.
      // editor.on('paste', (e) => {
      //   // ...
      // });

      editor.on('keydown', (e) => {
        if (e.key === 'Escape') {
          e.stopImmediatePropagation();
          editor.setContent(originalContent);
          cancel({ saved: false });
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          // Timeout to avoid "Uncaught TypeError: Cannot read properties of null (reading 'getStart')"
          // Hypothesis is the focusout destroys the editor before some internal tiny thing runs.
          setTimeout(() => editor.fire('focusout'));
        } else if (e.key === 'Enter' && type !== 'html') {
          e.preventDefault();
        } else if (
          validations?.maxLength &&
          // TODO: Check/improve regex
          /[a-zA-Z0-9-_ ]/.test(String.fromCharCode(e.keyCode)) &&
          getContent().length + 1 > parseInt(validations.maxLength.value) &&
          // If everything is selected and a key is pressed, essentially, it will
          // delete everything so no max-length problem
          getContent() !== getSelectionContent()
        ) {
          post(
            snackGuestMessage({
              id: 'maxLength',
              level: 'required',
              values: { maxLength: validations.maxLength.value }
            })
          );
          e.stopPropagation();
          return false;
        }
      });

      editor.on('DblClick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.nodeName === 'IMG') {
          window.tinymce.activeEditor.execCommand('mceImage');
        }
      });

      editor.on('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      // No point in waiting for `craftercms_tinymce_hooks` if the hook won't be loaded at all.
      external.craftercms_tinymce_hooks &&
        pluginManager.waitFor(
          'craftercms_tinymce_hooks',
          () => {
            const hooks = pluginManager.get('craftercms_tinymce_hooks');
            if (hooks) {
              pluginManager.get('craftercms_tinymce_hooks').setup?.(editor);
            } else {
              console.error(
                "The `craftercms_tinymce_hooks` was configured to be loaded but didn't load. Check the path is correct in the rte configuration file."
              );
            }
          },
          'loaded'
        );
    },
    ...(rteSetup?.tinymceOptions && {
      ...reversePluckProps(
        // Tiny seems to somehow mutate the options object which would cause crashes when attempting
        // to mutate immutable object (possibly from redux). Also, we don't want the state to get mutated.
        JSON.parse(JSON.stringify(rteSetup.tinymceOptions)),
        'target', // Target can't be changed
        'inline', // Not using inline view doesn't behave well on pageBuilder, this setting shouldn't be changed.
        'setup',
        'base_url',
        'encoding',
        'autosave_ask_before_unload', // Auto-save options are removed since it is not supported in control.
        'autosave_interval',
        'autosave_prefix',
        'autosave_restore_when_empty',
        'autosave_retention',
        'file_picker_callback', // No file picker is set by default, and functions are not supported in config file.
        'height', // Height is set to the size of content
        'file_picker_callback', // Files/images handlers currently not supported
        'paste_postprocess',
        'images_upload_handler',
        'code_editor_inline',
        'plugins', // Considered/used above, mixed with our options
        'external_plugins' // Considered/used above, mixed with our options
      )
    }),
    ...controlProps,
    openEditForm
  });

  return dispatch$.pipe(startWith({ type: editComponentInline.type }));
}
