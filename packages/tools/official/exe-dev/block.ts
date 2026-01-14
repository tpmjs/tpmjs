/**
 * Block metadata for exe.dev tools
 * This file provides metadata for the blocks validator
 */
import {
  create,
  deleteVm,
  exec,
  list,
  restart,
  shareAddLink,
  shareAddUser,
  sharePort,
  shareRemoveLink,
  shareRemoveUser,
  shareSetPrivate,
  shareSetPublic,
  shareShow,
  shelleyInstall,
  whoami,
} from './src/index.js';

export const block = {
  name: 'exe-dev',
  description: 'Manage exe.dev virtual machines via SSH',
  tools: {
    list,
    create,
    deleteVm,
    restart,
    exec,
    shareShow,
    shareSetPublic,
    shareSetPrivate,
    sharePort,
    shareAddUser,
    shareRemoveUser,
    shareAddLink,
    shareRemoveLink,
    whoami,
    shelleyInstall,
  },
};

export default block;
