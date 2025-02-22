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

import { SyntheticEvent } from 'react';
import { EditingStatus } from '../constants';
import { fetchSandboxItem, lock } from '@craftercms/studio-ui/services/content';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { message$, post } from '../utils/communicator';
import {
  requestWorkflowCancellationDialog,
  requestWorkflowCancellationDialogOnResult,
  snackGuestMessage
} from '@craftercms/studio-ui/state/actions/preview';
import { unlockItem } from '@craftercms/studio-ui/state/actions/content';
import { NEVER, Observable, of } from 'rxjs';
import { SandboxItem } from '@craftercms/studio-ui/models';
import { GuestState } from './models/GuestStore';
import { ElementRecord } from '../models/InContextEditing';
import { getCachedModel, getCachedModels, modelHierarchyMap } from '../contentController';
import { getParentModelId } from '../utils/ice';

export function dragOk(status): boolean {
  return [
    EditingStatus.SORTING_COMPONENT,
    EditingStatus.PLACING_NEW_COMPONENT,
    EditingStatus.PLACING_DETACHED_ASSET,
    EditingStatus.PLACING_DETACHED_COMPONENT,
    EditingStatus.UPLOAD_ASSET_FROM_DESKTOP
  ].includes(status);
}

export function unwrapEvent<T extends Event>(event: SyntheticEvent | Event): T {
  // @ts-ignore
  return event?.originalEvent ?? event?.nativeEvent ?? event;
}

export interface BeforeWriteProps<T = 'continue', S = never> {
  path: string;
  site: string;
  username: string;
  stop$?: Observable<S> | S[];
  continue$?: Observable<T> | T[];
  localItem: SandboxItem;
}

/**
 * Locks the target item, checks workflow state and checks for background changes
 * to the target. If all goes well, continues (returning the `continue$` stream). If
 * can't continue with the target operation, it returns the `stop$` stream (never, by default).
 */
export function beforeWrite$<T extends any = 'continue', S extends any = never>(
  props: BeforeWriteProps<T, S>
): Observable<T | S> {
  const { site, username, path, continue$ = of('continue') as Observable<T>, stop$ = NEVER, localItem } = props;
  return lock(site, path).pipe(
    switchMap(() => fetchSandboxItem(site, path)),
    switchMap((item) => {
      if (item.stateMap.submitted || item.stateMap.scheduled) {
        post(requestWorkflowCancellationDialog({ path, siteId: site }));
        return message$.pipe(
          filter((e) => e.type === requestWorkflowCancellationDialogOnResult.type),
          take(1),
          tap(({ payload }) => payload.type !== 'continue' && post(unlockItem({ path }))),
          switchMap(({ payload }) => (payload.type === 'continue' ? continue$ : stop$))
        );
        // TODO: commitId is not a property of SandboxItem after 4.2.0
        //  Date & time could be the new way
      } else if (item.commitId !== localItem.commitId && item.lockOwner?.username !== username) {
        post(snackGuestMessage({ id: 'outOfSyncContent', level: 'suggestion' }));
        post(unlockItem({ path }));
        setTimeout(() => window.location.reload());
        return stop$;
      } else {
        return continue$;
      }
    }),
    catchError(({ response, status }) => {
      if (status === 409) {
        post(snackGuestMessage({ id: 'itemLocked', level: 'suggestion', values: { lockOwner: response.person } }));
      }
      return stop$;
    })
  );
}

/**
 * Checks if the target item is locked and checks for background changes. Returns all the objects
 * it uses to compute the result, so they can be used by consumer if needed.
 */
export const checkIfLockedOrModified = (state: GuestState, record: ElementRecord) => {
  const { modelId } = record;
  const model = getCachedModel(modelId);
  const parentModelId = model.craftercms.path ? null : getParentModelId(modelId, getCachedModels(), modelHierarchyMap);
  const parentModel = parentModelId ? getCachedModel(parentModelId) : null;
  const path = model.craftercms.path ?? parentModel.craftercms.path;
  const isLocked = Boolean(state.lockedPaths[path]);
  const isExternallyModified = Boolean(state.externallyModifiedPaths[path]);
  return { isLocked, isExternallyModified, model, parentModelId, parentModel, path };
};
