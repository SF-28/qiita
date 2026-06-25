---
title: Tensorflow Lite × MobileNet v2
tags:
  - Python
  - TensorflowLite
  - MobileNetV2
private: false
updated_at: '2023-07-14T18:14:52+09:00'
id: aee745eff719b374e10c
organization_url_name: oec
slide: false
ignorePublish: false
---
# この記事について

- `tflite-model-maker`を使って、軽量な画像分類モデルを作成
- 作成したモデルを`tflite_runtime`で実行

# 動作環境

- macOS Ventura
- Python 3.9.16(asdf)
- Rancher Desktop

# tfliteモデル作成

## 仮想環境作成

```sh
mkdir tflite-model-maker
cd tflite-model-maker

# ASDFを利用する場合は以下
# asdf plugin add python
# asdf install python 3.9.16
# asdf local python 3.9.16

pip install pipenv
pipenv --python 3.9
```

## 必要なパッケージのインストール

```sh
pipenv install tflite-model-maker~=0.3.4 numpy~=1.23.5
pipenv install --dev ipykernel ipywidgets matplotlib
```

## JupyterNotebookでモデル作成

```sh
touch create_tflite_model.ipynb
```

```py:create_tflite_model.ipynb
from tflite_model_maker import model_spec
from tflite_model_maker import image_classifier
from tflite_model_maker.config import ExportFormat
from tflite_model_maker.image_classifier import DataLoader
import matplotlib.pyplot as plt
```

```py:create_tflite_model.ipynb
# 画像データの読込
# 以下のように、ラベル名をサブフォルダとした構成で配置する
"""
data
├─ dog
│   ├─ dog_1.jpg
│   ├─ dog_2.jpg
│   └─ ・・・
└─ cat
    ├─cat_1.jpg
    ├─cat_2.jpg
    └─ ・・・
"""

image_path = "./data/"
data = DataLoader.from_folder(image_path)
```

```text
data
 ├─ dog
 │   ├─ dog_1.jpg
 │   ├─ dog_2.jpg
 │   └─ ・・・
 └─ cat
     ├─cat_1.jpg
     ├─cat_2.jpg
     └─ ・・・
```

```py:create_tflite_model.ipynb
# 学習用データ80%, 検証用データ10%, テスト用データ10%に分ける
train_data, rest_data = data.split(0.8)
validation_data, test_data = rest_data.split(0.5)
```

```py:create_tflite_model.ipynb
# モデル作成
# 指定可能なベースモデルは以下を参照
# https://github.com/tensorflow/examples/blob/master/tensorflow_examples/lite/model_maker/core/task/model_spec/__init__.py
model = image_classifier.create(
    train_data,
    validation_data=validation_data,
    model_spec=model_spec.get('mobilenet_v2'),
    epochs=20
)
```

```py:create_tflite_model.ipynb
# テストデータの精度検証
loss, accuracy = model.evaluate(test_data)
```

```py:create_tflite_model.ipynb
# 公式ノートブックより、テストデータの予測結果(100枚まで)を表示する処理
# 誤った回答がされたものは赤色ラベルで表示される
def get_label_color(val1, val2):
  if val1 == val2:
    return 'black'
  else:
    return 'red'

plt.figure(figsize=(20, 20))
predicts = model.predict_top_k(test_data)
for i, (image, label) in enumerate(test_data.gen_dataset().unbatch().take(100)):
  ax = plt.subplot(10, 10, i+1)
  plt.xticks([])
  plt.yticks([])
  plt.grid(False)
  plt.imshow(image.numpy(), cmap=plt.cm.gray)

  predict_label = predicts[i][0][0]
  color = get_label_color(predict_label,
                          test_data.index_to_label[label.numpy()])
  ax.xaxis.label.set_color(color)
  plt.xlabel('Predicted: %s' % predict_label)
plt.show()
```

```py:create_tflite_model.ipynb
# モデルとラベルを保存する
model.export(export_dir='./model', export_format=ExportFormat.LABEL)
```

自前データで学習したモデルが簡単に作成できました

タスク内容にもよると思うが、精度もそれなりに出ている印象

# tfliteモデルで予測

推論に必要なパッケージだけがまとめられた`tflite-runtime`を使うことで、
ディスクスペースを節約しながらtfliteモデルの推論を実行することができる

https://www.tensorflow.org/lite/guide/python?hl=ja

ただ、macOS向けのビルド済みパッケージは現在提供されていないようで、
`pipenv install tflite-runtime`では取得できなかった

とりあえずコンテナで動かしてみる

## コンテナと推論用プログラムを作成

```sh
cd ..
mkdir tflite-runtime
cd tflite-runtime
mkdir app
cp -r ../tflite-model-maker/model app
touch app/predict.py
touch Dockerfile
touch compose.yml
```

```py:app/predict.py
# https://github.com/tensorflow/tensorflow/blob/master/tensorflow/lite/examples/python/label_image.py

# Copyright 2018 The TensorFlow Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================
"""label_image for tflite."""

import argparse
import time

import numpy as np
from PIL import Image
import tflite_runtime.interpreter as tflite

def load_labels(filename):
  with open(filename, 'r') as f:
    return [line.strip() for line in f.readlines()]


if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument(
      '-i',
      '--image',
      default='./img.jpg',
      help='image to be classified')
  parser.add_argument(
      '-m',
      '--model_file',
      default='./model/model.tflite',
      help='.tflite model to be executed')
  parser.add_argument(
      '-l',
      '--label_file',
      default='./model/labels.txt',
      help='name of file containing labels')
  parser.add_argument(
      '--input_mean',
      default=127.5, type=float,
      help='input_mean')
  parser.add_argument(
      '--input_std',
      default=127.5, type=float,
      help='input standard deviation')
  parser.add_argument(
      '--num_threads', default=None, type=int, help='number of threads')
  parser.add_argument(
      '-e', '--ext_delegate', help='external_delegate_library path')
  parser.add_argument(
      '-o',
      '--ext_delegate_options',
      help='external delegate options, \
            format: "option1: value1; option2: value2"')

  args = parser.parse_args()

  ext_delegate = None
  ext_delegate_options = {}

  # parse extenal delegate options
  if args.ext_delegate_options is not None:
    options = args.ext_delegate_options.split(';')
    for o in options:
      kv = o.split(':')
      if (len(kv) == 2):
        ext_delegate_options[kv[0].strip()] = kv[1].strip()
      else:
        raise RuntimeError('Error parsing delegate option: ' + o)

  # load external delegate
  if args.ext_delegate is not None:
    print('Loading external delegate from {} with args: {}'.format(
        args.ext_delegate, ext_delegate_options))
    ext_delegate = [
        tflite.load_delegate(args.ext_delegate, ext_delegate_options)
    ]

  interpreter = tflite.Interpreter(
      model_path=args.model_file,
      experimental_delegates=ext_delegate,
      num_threads=args.num_threads)
  interpreter.allocate_tensors()

  input_details = interpreter.get_input_details()
  output_details = interpreter.get_output_details()

  # check the type of the input tensor
  floating_model = input_details[0]['dtype'] == np.float32

  # NxHxWxC, H:1, W:2
  height = input_details[0]['shape'][1]
  width = input_details[0]['shape'][2]
  img = Image.open(args.image).resize((width, height))

  # add N dim
  input_data = np.expand_dims(img, axis=0)

  if floating_model:
    input_data = (np.float32(input_data) - args.input_mean) / args.input_std

  interpreter.set_tensor(input_details[0]['index'], input_data)

  start_time = time.time()
  interpreter.invoke()
  stop_time = time.time()

  output_data = interpreter.get_tensor(output_details[0]['index'])
  results = np.squeeze(output_data)

  top_k = results.argsort()[-5:][::-1]
  labels = load_labels(args.label_file)
  for i in top_k:
    if floating_model:
      print('{:08.6f}: {}'.format(float(results[i]), labels[i]))
    else:
      print('{:08.6f}: {}'.format(float(results[i] / 255.0), labels[i]))

  print('time: {:.3f}ms'.format((stop_time - start_time) * 1000))
```

```Dockerfile:Dockerfile
FROM python:3.9.16

RUN pip install tflite-runtime pillow

```

```yaml:compose.yml
version: '3'
services:
    tflite_runtime:
        build: .
        tty: true
        volumes:
            - ./app:/app

```

## 画像分類してみる

対象の画像を `app` フォルダ直下に配置

```sh
# コンテナ起動
docker compose build
docker compose up

### コンテナに接続
CONTAINER_ID=`docker ps --filter name=tflite-runtime --format "{{.ID}}"`
docker exec -it $CONTAINER_ID bash
cd /app

### 予測実行
python predict.py -i "./img.jpg"
```

モデルのロードから予測まで、数秒で実行できた

## サイズ確認

```sh
cd /usr/local/lib/python3.9/site-packages
du -h tflite_runtime

52K     tflite_runtime/__pycache__
7.0M    tflite_runtime

du -h tflite_runtime-2.11.0.dist-info/

24K     tflite_runtime-2.11.0.dist-info/
```

tflite_runtime自体のサイズも非常に小さい
これくらいならAWS Lambdaでも動かせるかも・・・？

# まとめ

`tflite-model-maker`を使うことで、シンプルに軽量モデルを作成できました
`tflite_runtime`自体が軽量なので、エッジデバイスでも問題なく動かせそうです

# 参考

https://www.tensorflow.org/lite/guide/model_maker?hl=ja

https://www.tensorflow.org/lite/models/modify/model_maker/image_classification

https://colab.research.google.com/github/tensorflow/tensorflow/blob/master/tensorflow/lite/g3doc/models/modify/model_maker/image_classification.ipynb

https://github.com/tensorflow/examples/tree/master/tensorflow_examples/lite/model_maker

https://github.com/tensorflow/tensorflow/tree/master/tensorflow/lite/examples/python

# トラブルシューティング

- 公式ノートブックを実行したところ、importでエラー

    ```text
    /usr/local/lib/python3.9/dist-packages/tensorflow_addons/utils/ensure_tf_install.py:53: UserWarning: Tensorflow Addons supports using Python ops for all Tensorflow versions above or equal to 2.9.0 and strictly below 2.12.0 (nightly versions are not supported).
     The versions of TensorFlow you are currently using is 2.8.4 and is not supported.
    Some things might work, some things might not.
    If you were to encounter a bug, do not file an issue.
    If you want to make sure you're using a tested and supported configuration, either change the TensorFlow version or the TensorFlow Addons's version.
    You can find the compatibility matrix in TensorFlow Addon's readme:
    https://github.com/tensorflow/addons
      warnings.warn(
    ---------------------------------------------------------------------------
    RuntimeError                              Traceback (most recent call last)
    RuntimeError: module compiled against API version 0x10 but this version of numpy is 0xf . Check the section C-API incompatibility at the Troubleshooting ImportError section at https://numpy.org/devdocs/user/troubleshooting-importerror.html#c-api-incompatibility for indications on how to solve this problem .
    ```

    以下コマンドでtensorflowのバージョンを落とすと動くようになりました
    `!pip uninstall -y tensorflow && pip install -q tensorflow==2.8.0`

- ローカル実行時、importでエラー

    ```text
    AttributeError: module 'numpy' has no attribute 'object'.
    `np.object` was a deprecated alias for the builtin `object`. To avoid this error in existing code, use `object` by itself. Doing this will not modify any behavior and is safe.
    The aliases was originally deprecated in NumPy 1.20; for more details and guidance see the original release note at:
        https://numpy.org/devdocs/release/1.20.0-notes.html#deprecations
    ```

    numpy 1.24以降だと動かないらしい
    https://stackoverflow.com/questions/75069062/module-numpy-has-no-attribute-object

    以下コマンドでバージョンを下げることで対応
    `pipenv install numpy~=1.23.5`

- 再度importを試みるもエラー

    ```text
    TqdmWarning: IProgress not found. Please update jupyter and ipywidgets
    ```

    `ipywidgets`の追加で解消しました
    `pipenv install --dev ipywidgets`

# macOS(x86_64)用`tflite_runtime`のビルド

以下を参考にビルドを試してみたが上手くいかなかった

https://www.tensorflow.org/lite/guide/build_cmake_pip?hl=ja

実施した手順は以下

```sh
mkdir tflite-runtime-mac
cd tflite-runtime-mac
asdf local python 3.9.16
asdf reshim
pip install numpy~=1.23.5 pybind11

brew install cmake
git clone https://github.com/tensorflow/tensorflow.git tensorflow_src

PYTHON=python3
tensorflow_src/tensorflow/lite/tools/pip_package/build_pip_package_with_cmake.sh native

# エラー内容
・・・
ld: symbol(s) not found for architecture x86_64
clang: error: linker command failed with exit code 1 (use -v to see invocation)
make[3]: *** [_pywrap_tensorflow_interpreter_wrapper.dylib] Error 1
make[2]: *** [CMakeFiles/_pywrap_tensorflow_interpreter_wrapper.dir/all] Error 2
make[1]: *** [CMakeFiles/_pywrap_tensorflow_interpreter_wrapper.dir/rule] Error 2
make: *** [_pywrap_tensorflow_interpreter_wrapper] Error 2
```
