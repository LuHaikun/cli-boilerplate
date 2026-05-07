#!/usr/bin/env node

import { runCli } from '../src/index'

const exitCode = await runCli(process.argv)

process.exitCode = exitCode
