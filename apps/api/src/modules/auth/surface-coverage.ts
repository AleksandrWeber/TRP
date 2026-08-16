/**
 * HTTP surface classification helpers (V3-S02-b).
 * Every customer route must be `@Public()` (C0) or `@RequirePermission(...)`.
 * Silence is not a grant.
 */

import { RequestMethod, type Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { PERMISSION_KEY } from './decorators/require-permission.decorator';
import { isKnownPermission, type PermissionClass } from './permission-catalog';

export type ClassifiedHttpHandler = Readonly<{
  controller: string;
  handler: string;
  method: string;
  path: string;
  public: boolean;
  permission: PermissionClass | null;
}>;

const METHOD_NAMES: Readonly<Record<number, string>> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.ALL]: 'ALL',
  [RequestMethod.OPTIONS]: 'OPTIONS',
  [RequestMethod.HEAD]: 'HEAD',
};

export function isHandlerClassified(handler: ClassifiedHttpHandler): boolean {
  return handler.public || handler.permission !== null;
}

export function collectControllerHandlers(controller: Type<object>): ClassifiedHttpHandler[] {
  const proto = controller.prototype as Record<string, unknown>;
  const controllerPath = Reflect.getMetadata(PATH_METADATA, controller) as unknown;
  const classPublic = Boolean(Reflect.getMetadata(IS_PUBLIC_KEY, controller));
  const classPermission = readPermission(Reflect.getMetadata(PERMISSION_KEY, controller));
  const names = Object.getOwnPropertyNames(proto).filter((name) => name !== 'constructor');
  const handlers: ClassifiedHttpHandler[] = [];

  for (const name of names) {
    const fn = proto[name];
    if (typeof fn !== 'function') {
      continue;
    }
    const method = Reflect.getMetadata(METHOD_METADATA, fn) as unknown;
    if (method === undefined || method === null) {
      continue;
    }
    const path = Reflect.getMetadata(PATH_METADATA, fn) as unknown;
    const methodPublic = Reflect.getMetadata(IS_PUBLIC_KEY, fn) as unknown;
    const methodPermission = readPermission(Reflect.getMetadata(PERMISSION_KEY, fn));
    handlers.push({
      controller: controller.name,
      handler: name,
      method: METHOD_NAMES[method as number] ?? String(method),
      path: joinPath(controllerPath, path),
      public: methodPublic === true || classPublic,
      permission: methodPermission ?? classPermission,
    });
  }

  return handlers;
}

function readPermission(value: unknown): PermissionClass | null {
  if (isKnownPermission(value)) {
    return value;
  }
  return null;
}

function joinPath(controllerPath: unknown, handlerPath: unknown): string {
  const left = typeof controllerPath === 'string' ? controllerPath : '';
  const right = typeof handlerPath === 'string' ? handlerPath : '';
  return `/${[left, right].filter(Boolean).join('/')}`.replace(/\/+/g, '/');
}
