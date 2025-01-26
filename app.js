require('dotenv').config();
const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(express.json());
let logs = [];
let latestStartLog = "";
function logMessage(message) {
    logs.push(message);
    if (logs.length > 5) logs.shift();
}
function executeCommand(command, actionName, isStartLog = false, callback) {
    exec(command, (err, stdout, stderr) => {
        const timestamp = new Date().toLocaleString();
        if (err) {
            logMessage(`${actionName} 执行失败: ${err.message}`);
            if (callback) callback(err.message);
            return;
        }
        if (stderr) {
            logMessage(`${actionName} 执行标准错误输出: ${stderr}`);
        }
        const successMsg = `${actionName} 执行成功:\n${stdout}`;
        logMessage(successMsg);
        if (isStartLog) latestStartLog = successMsg;
        if (callback) callback(stdout);
    });
}
function runShellCommand() {
    const command = `cd ${process.env.HOME}/serv00-play/singbox/ && bash start.sh`;
    executeCommand(command, "start.sh", true);
}
function executeHy2ipScript(logMessages, callback) {
    const username = process.env.USER.toLowerCase(); // 获取当前用户名并转换为小写
    logMessages.push(`Executing command for user: ${username}`);
    console.log(`Executing command for user: ${username}`);

    const command = `cd ${process.env.HOME}/domains/${username}.serv00.net/public_nodejs/ && bash hy2ip.sh`;
    logMessages.push(`Command to be executed: ${command}`);
    console.log(`Command to be executed: ${command}`);

    // 执行脚本并捕获输出
    exec(command, (error, stdout, stderr) => {
        callback(error, stdout, stderr);
    });
}
function KeepAlive() {
    const command = `cd ${process.env.HOME}/serv00-play/ && bash keepalive.sh`;
    executeCommand(command, "keepalive.sh", true);
}
setInterval(KeepAlive, 20000);
app.get("/info", (req, res) => {
    runShellCommand();
    KeepAlive();
    res.type("html").send(`
        <html>
        <head>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                    text-align: center;
                }
                .content-container {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    max-width: 600px;
                }
                .dynamic-text {
                    font-size: 30px;
                    font-weight: bold;
                    white-space: nowrap;
                    display: inline-block;
                }
                @keyframes growShrink {
                    0% {
                        transform: scale(1);
                    }
                    25% {
                        transform: scale(1.5);
                    }
                    50% {
                        transform: scale(1);
                    }
                }

                .dynamic-text span {
                    display: inline-block;
                    animation: growShrink 1s infinite;
                    animation-delay: calc(0.1s * var(--char-index));
                }
                .button-container {
                    margin-top: 20px;
                }
                button {
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    margin: 10px 20px;
                }
                button:hover {
                    background-color: #0056b3;
                }
            </style>
        </head>
        <body>
            <div class="content-container">
                <div class="dynamic-text">
                    <span style="--char-index: 0;">S</span>
                    <span style="--char-index: 1;">i</span>
                    <span style="--char-index: 2;">n</span>
                    <span style="--char-index: 3;">g</span>
                    <span style="--char-index: 4;">B</span>
                    <span style="--char-index: 5;">o</span>
                    <span style="--char-index: 6;">x</span>
                    <span style="--char-index: 7;"> </span>
                    <span style="--char-index: 8;">已</span>
                    <span style="--char-index: 9;">复</span>
                    <span style="--char-index: 10;">活</span>
                </div>
                <div class="dynamic-text" style="margin-top: 20px;">
                    <span style="--char-index: 11;">H</span>
                    <span style="--char-index: 12;">t</span>
                    <span style="--char-index: 13;">m</span>
                    <span style="--char-index: 14;">l</span>
                    <span style="--char-index: 15;">O</span>
                    <span style="--char-index: 16;">n</span>
                    <span style="--char-index: 17;">L</span>
                    <span style="--char-index: 18;">i</span>
                    <span style="--char-index: 19;">v</span>
                    <span style="--char-index: 20;">e</span>
                    <span style="--char-index: 21;"> </span>
                    <span style="--char-index: 22;">守</span>
                    <span style="--char-index: 23;">护</span>
                    <span style="--char-index: 24;">中</span>
                </div>
                <div class="button-container">
                    <button onclick="window.location.href='/hy2ip'">更新IP</button>
                    <button onclick="window.location.href='/node'">节点信息</button>
                    <button onclick="window.location.href='/log'">实时日志</button>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get("/hy2ip", (req, res) => {
    try {
        let logMessages = []; // 用于收集日志信息

        // 执行 hy2ip.sh 脚本并捕获输出
        executeHy2ipScript(logMessages, (error, stdout, stderr) => {
            if (error) {
                logMessages.push(`Error: ${error.message}`);
                res.status(500).json({ success: false, message: "hy2ip.sh 执行失败", logs: logMessages });
                return;
            }

            if (stderr) {
                logMessages.push(`stderr: ${stderr}`);
            }

            // 过滤掉不需要的部分
            let filteredOutput = stdout.split("\n").filter(line => {
                // 排除不需要的日志行
                return !line.includes("Received request") && 
                       !line.includes("Executing command") &&
                       !line.includes("Command to be executed") &&
                       !line.includes("\u001b[0m");
            }).join("\n");

            // 处理标准输出中的信息
            let outputMessages = filteredOutput.split("\n");

            // 获取成功更新的 IP（从输出中提取）
            let updatedIp = "";
            outputMessages.forEach(line => {
                if (line.includes("SingBox 配置文件成功更新IP为")) {
                    updatedIp = line.split("SingBox 配置文件成功更新IP为")[1].trim();
                }
                if (line.includes("Config 配置文件成功更新IP为")) {
                    updatedIp = line.split("Config 配置文件成功更新IP为")[1].trim();
                }
            });

            // 如果找到了更新的 IP，则返回成功信息
            if (updatedIp) {
                logMessages.push("hy2ip.sh 执行成功");
                logMessages.push(`SingBox 配置文件成功更新IP为 ${updatedIp}`);
                logMessages.push(`Config 配置文件成功更新IP为 ${updatedIp}`);
                logMessages.push("正在重启 sing-box...");

                // 将日志转换为 HTML 格式
                let htmlLogs = logMessages.map(msg => `<p>${msg}</p>`).join("");

                // 返回HTML格式的输出
                res.send(`
                    <html>
                        <head>
                            <title>hy2ip.sh 执行结果</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                }
                                .log-container {
                                    width: 100%;
                                    height: 300px;
                                    overflow-y: auto;
                                    border: 1px solid #ccc;
                                    padding: 10px;
                                    margin-top: 20px;
                                    background-color: #f9f9f9;
                                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                                }
                            </style>
                        </head>
                        <body>
                            <h1>hy2ip.sh 执行结果</h1>
                            <p><strong>成功：</strong> ${updatedIp}</p>
                            <div>
                                <h2>日志:</h2>
                                <div class="log-container">
                                    ${htmlLogs}
                                </div>
                            </div>
                            <h2>输出:</h2>
                            <p>SingBox 配置文件成功更新IP为 ${updatedIp}</p>
                            <p>Config 配置文件成功更新IP为 ${updatedIp}</p>
                            <p>正在重启 sing-box...</p>
                        </body>
                    </html>
                `);
            } else {
                logMessages.push("未能获取更新的 IP");

                res.status(500).json({
                    success: false,
                    message: "未能获取更新的 IP",
                    logs: logMessages
                });
            }
        });
    } catch (error) {
        let logMessages = [];
        logMessages.push("Error executing hy2ip.sh script:", error.message);

        res.status(500).json({ success: false, message: error.message, logs: logMessages });
    }
});

app.get("/node", (req, res) => {
    const filePath = path.join(process.env.HOME, "serv00-play/singbox/list");
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            res.type("html").send(`<pre>无法读取文件: ${err.message}</pre>`);
            return;
        }
        const vmessPattern = /vmess:\/\/[^\n]+/g;
        const hysteriaPattern = /hysteria2:\/\/[^\n]+/g;
        const proxyipPattern = /proxyip:\/\/[^\n]+/g;
        const vmessConfigs = data.match(vmessPattern) || [];
        const hysteriaConfigs = data.match(hysteriaPattern) || [];
        const proxyipConfigs = data.match(proxyipPattern) || [];
        const allConfigs = [...vmessConfigs, ...hysteriaConfigs, ...proxyipConfigs];
        let htmlContent = `
            <html>
            <head>
                <style>
                    .config-box {
                        max-height: 400px;  
                        overflow-y: auto;   
                        border: 1px solid #ccc;
                        padding: 10px;
                        background-color: #f4f4f4;
                    }
                    #configContent {
                        white-space: pre-wrap;  
                        text-align: left;       
                    }
                    .copy-btn {
                        padding: 5px 10px;
                        cursor: pointer;
                        background-color: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                    }
                    .copy-btn:hover {
                        background-color: #0056b3;
                    }
                </style>
            </head>
            <body>
                <div>
                    <h3>节点信息</h3>
                    <div class="config-box" id="configBox">
                        <pre id="configContent">
        `;
        allConfigs.forEach((config) => {
            htmlContent += `${config}\n`;
        });
        htmlContent += `
                        </pre>
                    </div>
                    <button class="copy-btn" onclick="copyToClipboard('#configContent')">一键复制</button>
                </div>

                <script>
                    function copyToClipboard(id) {
                        var text = document.querySelector(id).textContent;
                        var textarea = document.createElement('textarea');
                        textarea.value = text;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        alert('已复制到剪贴板！');
                    }
                </script>
            </body>
            </html>
        `;
        res.type("html").send(htmlContent);
    });
});
app.get("/log", (req, res) => {
    const command = "ps -A"; 
    exec(command, (err, stdout, stderr) => {
        if (err) {
            return res.type("html").send(`
                <pre><b>最近日志:</b>\n${logs[logs.length - 1] || "暂无日志"}</pre>
                <pre><b>进程详情:</b>\n执行错误: ${err.message}</pre>
            `);
        }
        const processOutput = stdout.trim(); 
        const latestLog = logs[logs.length - 1] || "暂无日志";
        res.type("html").send(`
            <html>
                <head>
                    <style>
                        .scrollable {
                            max-height: 300px;  
                            overflow-y: auto;   
                            border: 1px solid #ccc;
                            padding: 10px;
                            margin-top: 20px;
                            background-color: #f9f9f9;
                        }
                    </style>
                </head>
                <body>
                    <pre><b>最近日志:</b>\n${latestLog}</pre>
                    <div class="scrollable">
                        <pre><b>进程详情:</b>\n${processOutput}</pre>
                    </div>
                </body>
            </html>
        `);
    });
});
app.use((req, res, next) => {
    const validPaths = ["/info", "/hy2ip", "/node", "/log"];
    if (validPaths.includes(req.path)) {
        return next();
    }
    res.status(404).send("页面未找到");
});
app.listen(3000, () => {
    const timestamp = new Date().toLocaleString();
    const startMsg = `${timestamp} 服务器已启动，监听端口 3000`;
    logMessage(startMsg);
    console.log(startMsg);
});
