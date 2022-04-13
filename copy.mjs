import path from 'path'
import fs from 'fs-extra'

async function copy() {
  const srcRoot = path.resolve('src')
  const srcFolders = await fs.readdir(srcRoot)
  await Promise.all(
    srcFolders.map((srcFolder) => {
      const copyFrom = path.join(srcRoot, srcFolder, 'public')
      const copyTo = path.resolve(srcRoot, `../dist/${srcFolder}`)
      return fs.copy(copyFrom, copyTo)
    })
  )
}

fs.copy('./index.html', './dist/index.html')
fs.copy('./favicon.ico', './dist/favicon.ico')

copy()
