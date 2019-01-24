import { app, BrowserWindow, Menu } from 'electron' // eslint-disable-line
const express = require('express');
const bodyParser = require('body-parser');
const expressApp = express();
const Client = require('@vpubevo/vpub-core');
const client = new Client({
  username: 'mn',
  password: '999000',
  port: 9902,
});

expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use(bodyParser.json());

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;

expressApp.get('/do-auth/:accessToken', (req, res) => {
  mainWindow.webContents.send('do-oauth-reply', req.params.accessToken);
  const html = `<html>
    <head>
      <title>Vpub Masternode Installer</title>
      <style>
        body {
          background-color: #00152E;
          height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 30px;
          font-weight: bolder;
          font-family: Helvetica, Arial;
          overflow: hidden;
        }
        div {
          margin: 0 auto;
          text-align: center;
          width: 100%;
        }
        svg {
          margin-bottom: 30px;
          height: 40vh;
          width: auto;
        }
      </style>
    </head>
    <body>
    <div>
      <div>
      <svg width="225px" height="207px" viewBox="0 0 225 207" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="62949-OAYY6C-555" transform="translate(-43.000000, -55.000000)">
                <g id="Group" transform="translate(43.000000, 55.000000)">
                    <path d="M221.987,92.307 C217.816,71.526 208.021,50.886 193.694,35.148 C177.453,17.311 154.661,5.4 130.882,1.661 C127.285,1.097 123.67,0.745 120.047,0.551 C100.473,-0.992 79.789,4.192 62.852,13.229 C41.471,24.647 24.543,43.638 13.61,65.099 C1.892,88.102 -3.416,115.143 2.73,140.536 C8.126,162.833 22.144,183.288 42.599,194.212 C67.119,207.297 96.576,208.108 123.609,206.071 C145.227,204.44 166.793,200.199 185.203,188.146 C216.847,167.445 229.296,128.721 221.987,92.307" id="Fill-125" fill="#F9F7F4"></path>
                    <path d="M164.039,114.67 C164.054,114.936 164.054,115.187 164.054,115.437 C163.226,117.997 162.482,120.588 161.699,123.171 C157.711,128.861 149.408,131.527 142.616,132.781 C132.171,134.695 121.497,135.553 110.885,135.546 C100.203,135.538 89.538,134.596 79.031,132.712 C74.443,131.892 67.689,131.565 64.134,128.223 C61.057,125.336 60.146,120.489 59.462,116.448 C68.502,120.975 78.917,123.277 88.748,124.796 C99.656,126.49 111.014,127.349 122.006,126.088 C131.958,124.948 141.72,122.457 151.223,119.342 C155.538,117.929 159.83,116.394 164.039,114.67" id="Fill-126" fill="#F9F7F4"></path>
                    <path d="M159.724,129.043 C159.382,129.924 159.033,130.798 158.645,131.664 C154.027,142.011 146.984,151.309 136.911,156.832 C123.928,163.943 106.949,164.52 93.154,159.491 C81.69,155.313 72.597,146.675 66.565,136.199 C65.691,134.672 64.787,133.024 63.929,131.299 C66.869,133.236 70.553,133.837 74.048,134.566 C86.377,137.134 99.011,138.372 111.599,138.341 C123.814,138.311 136.668,137.483 148.526,134.376 C152.477,133.343 156.473,131.565 159.724,129.043" id="Fill-127" fill="#885C29"></path>
                    <path d="M82.594,85.939 C83.05,80.051 73.82,78.95 72.392,84.556 C70.948,90.246 70.91,96.749 71.662,102.545 C72.528,109.177 81.394,108.524 81.531,102.545 L81.607,102.545 C81.546,96.916 82.161,91.523 82.594,85.939 Z M152.598,102.545 C153.35,96.749 153.312,90.246 151.869,84.556 C150.456,79.011 141.211,79.991 141.667,85.939 C142.1,91.523 142.715,96.916 142.654,102.545 L142.73,102.545 C142.897,108.448 151.717,109.269 152.598,102.545 Z M168.316,112.262 C168.848,110.91 167.177,110.119 166.136,110.583 C153.525,116.174 139.843,120.39 126.238,122.571 C107.086,125.64 86.362,122.943 67.978,117.01 C64.894,116.015 61.695,115.019 58.733,113.637 C58.254,112.231 55.815,112.383 55.838,114.123 C55.937,120.968 59.158,128.352 62.159,134.33 C67.591,145.148 76.015,154.621 86.955,160.053 C100.576,166.822 117.851,167.604 132.087,162.279 C143.847,157.888 152.895,149 158.805,138.068 C161.259,133.525 162.869,128.792 164.389,124.022 C165.779,121.826 166.66,119.312 166.804,116.478 C167.275,115.065 167.777,113.66 168.316,112.262 Z M199.736,79.793 C210.66,109.869 206.497,145.718 181.778,167.673 C170.185,177.966 155.44,183.884 140.345,186.763 C129.261,188.883 117.722,189.597 106.456,189.825 C94.772,190.06 82.883,188.7 71.548,185.836 C51.349,180.731 35.107,168.455 25.968,149.585 C16.685,130.41 16.662,108.228 22.997,88.15 C29.941,66.149 44.17,45.722 63.314,32.67 C76.942,23.395 94.354,17.287 111.393,16.801 C111.599,17.249 112.016,17.591 112.67,17.583 C133.53,17.469 154.186,24.466 170.496,37.54 C184.095,48.441 193.818,63.49 199.736,79.793 Z" id="Fill-128" fill="#F6C636"></path>
                    <path d="M69.664,25.735 C84.258,17.948 102.08,13.481 118.945,14.81 C122.067,14.977 125.182,15.281 128.281,15.768 C148.77,18.989 168.407,29.252 182.4,44.62 C194.745,58.18 203.185,75.964 206.779,93.87 C213.076,125.245 202.35,158.61 175.085,176.447 C159.223,186.832 140.641,190.486 122.014,191.891 C98.722,193.646 73.341,192.947 52.215,181.673 C34.59,172.261 22.511,154.637 17.862,135.424 C12.567,113.546 17.14,90.246 27.237,70.426 C36.657,51.936 51.242,35.572 69.664,25.735 Z M111.393,16.801 C94.354,17.287 76.942,23.395 63.314,32.67 C44.17,45.722 29.941,66.149 22.997,88.15 C16.662,108.228 16.685,130.41 25.968,149.585 C35.107,168.455 51.349,180.731 71.548,185.836 C82.883,188.7 94.772,190.06 106.456,189.825 C117.722,189.597 129.261,188.883 140.345,186.763 C155.44,183.884 170.185,177.966 181.778,167.673 C206.497,145.718 210.66,109.869 199.736,79.793 C193.818,63.49 184.095,48.441 170.496,37.54 C154.186,24.466 133.53,17.469 112.67,17.583 C112.016,17.591 111.599,17.249 111.393,16.801 Z" id="Fill-129" fill="#16110D"></path>
                    <path d="M158.645,131.664 C159.033,130.798 159.382,129.924 159.724,129.043 C156.473,131.565 152.477,133.343 148.526,134.376 C136.668,137.483 123.814,138.311 111.599,138.341 C99.011,138.372 86.377,137.134 74.048,134.566 C70.553,133.837 66.869,133.236 63.929,131.299 C64.787,133.024 65.691,134.672 66.565,136.199 C72.597,146.675 81.69,155.313 93.154,159.491 C106.949,164.52 123.928,163.943 136.911,156.832 C146.984,151.309 154.027,142.011 158.645,131.664 Z M164.054,115.437 C164.054,115.187 164.054,114.936 164.039,114.67 C159.83,116.394 155.538,117.929 151.223,119.342 C141.72,122.457 131.958,124.948 122.006,126.088 C111.014,127.349 99.656,126.49 88.748,124.796 C78.917,123.277 68.502,120.975 59.462,116.448 C60.146,120.489 61.057,125.336 64.134,128.223 C67.689,131.565 74.443,131.892 79.031,132.712 C89.538,134.596 100.203,135.538 110.885,135.546 C121.497,135.553 132.171,134.695 142.616,132.781 C149.408,131.527 157.711,128.861 161.699,123.171 C162.482,120.588 163.226,117.997 164.054,115.437 Z M166.136,110.583 C167.177,110.119 168.848,110.91 168.316,112.262 C167.777,113.66 167.275,115.065 166.804,116.478 C166.66,119.312 165.779,121.826 164.389,124.022 C162.869,128.792 161.259,133.525 158.805,138.068 C152.895,149 143.847,157.888 132.087,162.279 C117.851,167.604 100.576,166.822 86.955,160.053 C76.015,154.621 67.591,145.148 62.159,134.33 C59.158,128.352 55.937,120.968 55.838,114.123 C55.815,112.383 58.254,112.231 58.733,113.637 C61.695,115.019 64.894,116.015 67.978,117.01 C86.362,122.943 107.086,125.64 126.238,122.571 C139.843,120.39 153.525,116.174 166.136,110.583 Z" id="Fill-130" fill="#16110D"></path>
                    <path d="M151.869,84.556 C153.312,90.246 153.35,96.749 152.598,102.545 C151.717,109.269 142.897,108.448 142.73,102.545 L142.654,102.545 C142.715,96.916 142.1,91.523 141.667,85.939 C141.211,79.991 150.456,79.011 151.869,84.556" id="Fill-131" fill="#16110D"></path>
                    <path d="M72.392,84.556 C73.82,78.95 83.05,80.051 82.594,85.939 C82.161,91.523 81.546,96.916 81.607,102.545 L81.531,102.545 C81.394,108.524 72.528,109.177 71.662,102.545 C70.91,96.749 70.948,90.246 72.392,84.556" id="Fill-132" fill="#16110D"></path>
                    <path d="M53.394,55.368 C68.661,44.084 86.174,37.665 104.817,34.786 C108.051,34.287 109.84,30.23 109.045,27.339 C108.1,23.901 104.839,22.591 101.598,23.111 C81.926,26.267 63.744,36.827 50.194,51.22 C48.237,53.298 50.882,57.225 53.394,55.368" id="Fill-133" fill="#EB9F35"></path>
                    <path d="M122.386,37.635 C123.862,37.635 125.413,36.993 126.457,35.949 C127.018,35.427 127.415,34.81 127.647,34.096 C128.008,33.41 128.173,32.67 128.143,31.878 C128.076,30.389 127.587,28.845 126.457,27.807 C125.33,26.773 123.946,26.121 122.386,26.121 C120.91,26.121 119.359,26.763 118.315,27.807 C117.754,28.328 117.357,28.946 117.125,29.66 C116.764,30.346 116.599,31.085 116.629,31.878 C116.696,33.367 117.185,34.911 118.315,35.949 C119.442,36.982 120.826,37.635 122.386,37.635" id="Fill-134" fill="#EB9F35"></path>
                    <path d="M78.892,18.283 C81.7,16.673 84.632,15.78 87.741,14.959 C89.295,14.549 88.624,12.305 87.087,12.584 C83.783,13.184 80.671,14.717 77.856,16.51 C76.745,17.218 77.739,18.945 78.892,18.283" id="Fill-135" fill="#16110D"></path>
                    <path d="M98.349,12.239 C100.633,11.833 102.933,11.548 105.225,11.192 C106.8,10.948 106.167,8.386 104.553,8.754 C102.305,9.267 100.077,9.848 97.817,10.311 C96.548,10.57 97.095,12.463 98.349,12.239" id="Fill-136" fill="#16110D"></path>
                    <path d="M119.349,12.215 C121.918,12.459 124.414,12.979 126.961,13.344 C128.516,13.567 129.238,11.364 127.63,10.918 C124.982,10.183 122.08,10.06 119.349,10.144 C117.996,10.185 118.039,12.091 119.349,12.215" id="Fill-137" fill="#16110D"></path>
                    <path d="M139.627,15.898 C142.582,17.1 145.583,18.364 148.592,19.414 C149.945,19.887 150.894,17.695 149.577,17.077 C146.633,15.694 143.338,14.653 140.174,13.912 C138.852,13.602 138.425,15.409 139.627,15.898" id="Fill-138" fill="#16110D"></path>
                    <path d="M162.682,24.775 C165.118,26.453 167.474,28.234 169.856,29.987 C171.199,30.975 172.488,28.732 171.162,27.752 C168.794,26.003 166.287,24.438 163.758,22.935 C162.564,22.225 161.566,24.005 162.682,24.775" id="Fill-139" fill="#16110D"></path>
                    <path d="M178.029,36.482 C179.733,38.187 181.5,39.898 183.365,41.428 C184.616,42.455 186.42,40.727 185.173,39.619 C183.298,37.952 181.248,36.414 179.219,34.939 C178.301,34.272 177.259,35.711 178.029,36.482" id="Fill-140" fill="#16110D"></path>
                    <path d="M190.712,48.534 C192.685,51.495 195.043,54.347 197.462,56.954 C198.423,57.99 200.35,56.577 199.461,55.411 C197.298,52.574 194.913,49.747 192.324,47.29 C191.509,46.516 190.042,47.529 190.712,48.534" id="Fill-141" fill="#16110D"></path>
                    <path d="M200.738,63.991 C201.955,65.688 202.942,67.495 204.006,69.286 C204.841,70.692 206.959,69.446 206.194,68.007 C205.181,66.101 203.757,64.369 202.322,62.769 C201.569,61.929 200.064,63.052 200.738,63.991" id="Fill-142" fill="#16110D"></path>
                    <path d="M208.559,80.731 C208.778,83.849 209.376,86.993 210.716,89.836 C211.295,91.065 213.43,90.189 212.934,88.901 C211.901,86.214 210.998,83.611 210.666,80.731 C210.514,79.415 208.463,79.357 208.559,80.731" id="Fill-143" fill="#16110D"></path>
                    <path d="M212.483,102.217 C212.898,104.826 212.857,107.372 212.536,109.985 C212.357,111.435 214.888,111.792 215.106,110.333 C215.542,107.415 215.317,104.492 214.423,101.682 C214.023,100.423 212.283,100.959 212.483,102.217" id="Fill-144" fill="#16110D"></path>
                    <path d="M211.545,124.114 C211.034,126.93 210.354,129.676 209.666,132.451 C209.273,134.036 211.587,134.656 212.098,133.122 C213.029,130.327 213.519,127.344 213.743,124.412 C213.838,123.167 211.771,122.87 211.545,124.114" id="Fill-145" fill="#16110D"></path>
                    <path d="M206.91,143.159 C206.445,146.183 205.392,148.959 203.771,151.553 C202.93,152.899 204.998,154.064 205.877,152.784 C207.798,149.989 208.778,146.809 208.886,143.426 C208.922,142.319 207.085,142.02 206.91,143.159" id="Fill-146" fill="#16110D"></path>
                    <path d="M197.06,163.561 C196.061,165.365 195.326,167.28 194.22,169.034 C193.108,170.796 191.682,172.281 190.45,173.947 C189.564,175.145 191.395,176.298 192.393,175.447 C195.385,172.896 198.106,168.148 198.698,164.251 C198.839,163.318 197.592,162.599 197.06,163.561" id="Fill-147" fill="#16110D"></path>
                    <path d="M183.696,178.525 C181.216,180.887 178.011,182.655 175.002,184.256 C173.877,184.856 174.662,186.854 175.89,186.361 C179.569,184.883 182.25,182.625 185.014,179.843 C185.862,178.99 184.565,177.698 183.696,178.525" id="Fill-148" fill="#16110D"></path>
                    <path d="M166.178,188.039 C163.57,188.896 160.846,189.319 158.145,189.767 C156.75,189.999 157.06,192.446 158.483,192.262 C161.37,191.889 164.007,190.991 166.692,189.904 C167.815,189.45 167.388,187.641 166.178,188.039" id="Fill-149" fill="#16110D"></path>
                    <path d="M145.452,194.262 C141.602,195.997 137.593,196.74 133.399,196.965 C131.728,197.055 131.701,199.586 133.399,199.582 C138.024,199.572 142.445,198.224 146.494,196.045 C147.686,195.404 146.639,193.727 145.452,194.262" id="Fill-150" fill="#16110D"></path>
                    <path d="M119.725,198.128 C115.549,197.957 111.376,197.649 107.194,197.833 C105.635,197.902 105.645,200.154 107.194,200.249 C111.371,200.505 115.548,200.268 119.725,200.169 C121.041,200.138 121.037,198.181 119.725,198.128" id="Fill-151" fill="#16110D"></path>
                    <path d="M92.363,196.935 C88.19,196.988 84.012,196.943 79.855,197.368 C78.22,197.535 78.142,200.022 79.855,199.979 C84.047,199.874 88.202,199.298 92.363,198.822 C93.538,198.688 93.609,196.919 92.363,196.935" id="Fill-152" fill="#16110D"></path>
                    <path d="M69.022,194.441 C65.688,192.935 62.412,191.153 58.964,189.921 C57.582,189.427 56.624,191.663 57.958,192.307 C61.256,193.901 64.822,194.987 68.236,196.307 C69.305,196.721 70.076,194.917 69.022,194.441" id="Fill-153" fill="#16110D"></path>
                    <path d="M47.539,186.478 C44.472,184.473 42.092,181.76 39.454,179.262 C38.194,178.069 36.536,179.832 37.587,181.13 C39.996,184.103 43.361,186.145 46.592,188.097 C47.632,188.725 48.543,187.134 47.539,186.478" id="Fill-154" fill="#16110D"></path>
                    <path d="M32.418,172.686 C29.783,171.004 27.705,168.442 25.474,166.29 C24.484,165.335 22.576,166.645 23.484,167.825 C25.673,170.67 28.538,172.362 31.489,174.274 C32.485,174.919 33.415,173.322 32.418,172.686" id="Fill-155" fill="#16110D"></path>
                    <path d="M18.486,151.797 C18.032,148.007 16.918,144.514 14.55,141.476 C13.706,140.395 12.1,141.773 12.709,142.897 C14.301,145.834 15.716,148.792 16.44,152.073 C16.688,153.198 18.628,152.975 18.486,151.797" id="Fill-156" fill="#16110D"></path>
                    <path d="M60.998,26.185 C62.953,24.798 65.018,23.883 67.24,23.02 C68.73,22.442 68.152,20.064 66.565,20.571 C64.047,21.375 61.766,22.891 59.779,24.605 C58.924,25.343 60.063,26.85 60.998,26.185" id="Fill-157" fill="#16110D"></path>
                    <path d="M43.275,38.856 C46.241,36.504 49.392,34.373 52.273,31.917 C53.339,31.009 51.887,29.084 50.759,29.954 C47.692,32.32 44.884,35.011 41.903,37.484 C40.933,38.288 42.312,39.619 43.275,38.856" id="Fill-158" fill="#16110D"></path>
                    <path d="M30.362,52.549 C31.927,50.823 33.527,49.127 35.083,47.393 C36.162,46.19 34.33,44.404 33.32,45.63 C31.832,47.438 30.389,49.282 28.91,51.097 C28.092,52.102 29.46,53.545 30.362,52.549" id="Fill-159" fill="#16110D"></path>
                    <path d="M21.267,70.914 C22.489,68.602 23.992,66.559 25.693,64.58 C26.755,63.345 24.971,61.538 23.893,62.78 C22.058,64.893 20.62,67.324 19.504,69.883 C18.992,71.056 20.638,72.102 21.267,70.914" id="Fill-160" fill="#16110D"></path>
                    <path d="M11.915,87.684 C11.315,90.899 10.752,94.188 10.463,97.447 C10.34,98.84 12.704,99.18 12.929,97.78 C13.447,94.547 13.714,91.222 13.92,87.956 C13.991,86.821 12.126,86.547 11.915,87.684" id="Fill-161" fill="#16110D"></path>
                    <path d="M8.752,116.059 C8.495,118.89 8.501,121.674 9.543,124.371 C10.12,125.863 12.433,125.307 11.992,123.696 C11.308,121.193 10.647,118.68 10.74,116.059 C10.787,114.764 8.866,114.804 8.752,116.059" id="Fill-162" fill="#16110D"></path>
                </g>
            </g>
        </g>
      </svg>
      </div>
      <div>
        Done, now you can close this tab and return to the installer.
      </div>
      </div>
    </body>
  </html>`;
  res.send(html);
});

function createWindow() {
  expressApp.listen(3456, () => {
    console.log('oAuth Server listening on port 3456!');
  });
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 700,
    useContentSize: true,
    width: 500,
    webPreferences: {
      allowRunningInsecureContent: true,
      webSecurity: false,
    },
  });

  mainWindow.loadURL(winURL);

  // mainWindow.toggleDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create the Application's main menu
  const template = [{
    label: 'Application',
    submenu: [
      { label: 'Open Developer Tools', click() { mainWindow.webContents.openDevTools(); } },
      { label: 'Quit', accelerator: 'Command+Q', click() { app.quit(); } },
    ],
  }, {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:',
      },
    ],
  }];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('ready', createWindow);

app.on('quit', () => {
  client
    .stop()
    .then(() => {
      setTimeout(() => {
        app.quit();
      }, 1000);
    })
    .catch(() => {
      setTimeout(() => {
        app.quit();
      }, 1000);
    });
});

app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  client
    .stop()
    .then(() => {
      setTimeout(() => {
        app.quit();
      }, 1000);
    })
    .catch(() => {
      app.quit();
    });
  // }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
