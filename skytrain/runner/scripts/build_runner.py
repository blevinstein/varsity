
import os
from zipfile import ZipFile

def main():
  with ZipFile('deploy.zip', 'w') as f:
    f.write('../scripts/common.js', 'common.js')
    for environment in ['test']:
      f.write('../configs/%s.json' % environment, 'configs/%s.json' % environment)
    for root,dirs,files in os.walk('.'):
      for file in files:
        if file == 'deploy.zip':
          continue
        path = os.path.join(root, file)
        print('Adding %s' % path)
        f.write(path)

if __name__ == '__main__':
  main()
