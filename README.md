# RescueTime Scraper

> Scrapes RescueTime API for hourly summary data of a given period

### How to setup:

1. `yarn install` or `npm install`.

2. create a `.env` file and add the following:

```sh
RESCUETIME_API_KEY=<key> # your RescueTime API key
START_DATE=2020-09-01 # start date in YYYY-MM-DD format
END_DATE=2020-09-30 # start date in YYYY-MM-DD format
OUTPUT_PATH=./output # output folder path
```

3. Run `yarn start` or `npm start` to run the scraper.