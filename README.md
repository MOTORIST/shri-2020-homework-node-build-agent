# CI Build Agent

# Принцип работы

При старте:
- агент регистрируется
- запускатся loop регистрации агентов (если сервер упадет, то агент перерегистрирует себя)

Сборка проходит в docker контейнере.

Сборка:
- удаляется старый конетйнер
- поднимается новый
- клонируется репозиторий
- переключается на коммит
- запускается команда
- отправляется результат

Для решения проблем с connect и ошибками типа 500 используется retry помощник в папке helpers.

## Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Usage](#usage)

## About <a name = "about"></a>

Build agent for continuous integration system.
- https://github.com/MOTORIST/shri-2020-homework-node
- https://github.com/MOTORIST/shri-2020-homework-node-build-server
- https://github.com/MOTORIST/shri-2020-homework-node-build-agent

## Getting Started <a name = "getting_started"></a>

### Installing

```
git clone https://github.com/MOTORIST/shri-2020-homework-node-build-agent.git

cd shri-2020-homework-node-build-agent && yarn install

rename .env.example to .env
```

**NOTE! If set ENV=dev, build server events will be displayed.**

## Usage <a name = "usage"></a>

```
yarn start
or 
yarn dev
```
