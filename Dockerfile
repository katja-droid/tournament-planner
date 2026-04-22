FROM node:22-bookworm

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY front/package.json ./front/
COPY back/package.json ./back/

RUN npm ci

COPY back/python/requirements.txt ./back/python/requirements.txt
RUN python3 -m pip install --break-system-packages -r back/python/requirements.txt

COPY . .

RUN npm run build:front

ENV NODE_ENV=production
ENV PORT=4000
ENV PYTHON_EXECUTABLE=python3

EXPOSE 4000

CMD ["npm", "run", "start:back"]
