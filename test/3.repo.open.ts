import test from 'ava';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import os from 'os';
import { join } from '../src/path';

import { Repository } from '../src/repository';
import { testRepoCommondirInside, testRepoCommondirOutside } from './2.repo.init';

function createRepoPath(): string {
  while (true) {
    const name = crypto.createHash('sha256').update(process.hrtime().toString()).digest('hex').substring(0, 6);
    const repoPath = join(os.tmpdir(), 'snowtrack-repo', name);
    if (!fse.pathExistsSync(repoPath)) {
      return repoPath;
    }
  }
}

async function rmDirRecursive(dir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.rmdir(dir, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

test('repo open-commondir-outside', async (t) => {
  const repoPath = createRepoPath();
  const commondir = createRepoPath();

  let repo: Repository;
  t.log(`Initialize repo at ${repoPath}`);
  await Repository.initExt(repoPath, { commondir });

  await Repository.open(repoPath)
    .then((repoResult: Repository) => {
      repo = repoResult;
      t.log(`Opened repo at ${repo.workdir()}`);
      t.log(`Found commondir at ${repo.commondir()}`);
      return testRepoCommondirOutside(t, repo);
    })
    .then(() => // cleanup unit-test
      rmDirRecursive(repo.workdir()))
    .then((): Promise<void> => // cleanup unit-test
      rmDirRecursive(repo.commondir()));
});

test('repo open-commondir-outside-subdirectory', async (t) => {
  /* Create a repository with a subdirectory and open the repo from the subdirectory.
  The test ensures that Repository.open travels up the hierarchy to find the next .snow repo */
  const repoPath = createRepoPath();
  const commondir = createRepoPath();

  let repo: Repository;
  t.log(`Initialize repo at ${repoPath}`);
  await Repository.initExt(repoPath, { commondir });

  // create directory and open the repo from the sub-directory
  const fooDir = join(repoPath, 'foo');
  fse.mkdirpSync(fooDir);
  await Repository.open(fooDir)
    .then((repoResult: Repository) => {
      repo = repoResult;
      t.log(`Opened repo at ${repo.workdir()}`);
      t.log(`Found commondir at ${repo.commondir()}`);
      t.is(repoResult.workdir(), repoPath, 'expect repository being opened from subdirectory');
    })
    .then(() => // cleanup unit-test
      rmDirRecursive(repo.workdir()))
    .then((): Promise<void> => // cleanup unit-test
      rmDirRecursive(repo.commondir()));
});

test('repo open-commondir-inside', async (t) => {
  const repoPath = createRepoPath();

  let repo: Repository;
  t.log(`Initialize repo at ${repoPath}`);
  await Repository.initExt(repoPath);

  await Repository.open(repoPath)
    .then((repoResult: Repository) => {
      repo = repoResult;
      t.log(`Opened repo at ${repo.workdir()}`);
      t.log(`Found commondir at ${repo.commondir()}`);
      return testRepoCommondirInside(t, repo);
    })
    .then(() => // cleanup unit-test
      rmDirRecursive(repo.workdir()))
    .then((): Promise<void> => // cleanup unit-test
      rmDirRecursive(repo.commondir()));
});

test('repo open-commondir-inside-subdirectory', async (t) => {
  /* Create a repository with a subdirectory and open the repo from the subdirectory.
  The test ensures that Repository.open travels up the hierarchy to find the next .snow repo */
  const repoPath = createRepoPath();

  let repo: Repository;
  t.log(`Initialize repo at ${repoPath}`);
  await Repository.initExt(repoPath);

  // create directory and open the repo from the sub-directory
  const fooDir = join(repoPath, 'foo');
  fse.mkdirpSync(fooDir);
  await Repository.open(fooDir)
    .then((repoResult: Repository) => {
      repo = repoResult;
      t.log(`Opened repo at ${repo.workdir()}`);
      t.log(`Found commondir at ${repo.commondir()}`);
      t.is(repoResult.workdir(), repoPath, 'expect repository being opened from subdirectory');
    })
    .then(() => // cleanup unit-test
      rmDirRecursive(repo.workdir()))
    .then((): Promise<void> => // cleanup unit-test
      rmDirRecursive(repo.commondir()));
});
