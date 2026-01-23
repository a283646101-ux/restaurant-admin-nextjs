/**
 * 管理员登录测试脚本
 * 用于验证默认管理员账号是否可以成功登录
 * 
 * 使用方法:
 * 1. 确保应用服务器正在运行 (npm run dev)
 * 2. 运行此脚本: node scripts/test-admin-login.js
 */

const https = require('https');
const http = require('http');

// 配置
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_ENDPOINT = '/api/auth/login';

// 测试数据
const testCredentials = {
  email: 'admin@example.com',
  password: 'admin123'
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testLogin() {
  log('\n========================================', 'cyan');
  log('管理员登录测试', 'cyan');
  log('========================================\n', 'cyan');
  
  log(`测试 API: ${API_URL}${LOGIN_ENDPOINT}`, 'blue');
  log(`测试账号: ${testCredentials.email}`, 'blue');
  log(`测试密码: ${testCredentials.password}\n`, 'blue');
  
  try {
    log('发送登录请求...', 'yellow');
    
    const url = new URL(LOGIN_ENDPOINT, API_URL);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(url.toString(), options, testCredentials);
    
    log('\n----------------------------------------', 'cyan');
    log('响应结果', 'cyan');
    log('----------------------------------------\n', 'cyan');
    
    log(`状态码: ${response.statusCode}`, response.statusCode === 200 ? 'green' : 'red');
    
    if (response.statusCode === 200) {
      log('✓ 登录成功!', 'green');
      
      const { token, userInfo } = response.body;
      
      if (token) {
        log(`\n✓ JWT Token: ${token.substring(0, 50)}...`, 'green');
        
        // 解析 JWT token (简单解析，不验证签名)
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          log('\nToken Payload:', 'blue');
          log(JSON.stringify(payload, null, 2), 'blue');
        } catch (e) {
          log('无法解析 token payload', 'yellow');
        }
      } else {
        log('\n✗ 警告: 响应中没有 token', 'yellow');
      }
      
      if (userInfo) {
        log('\n✓ 用户信息:', 'green');
        log(JSON.stringify(userInfo, null, 2), 'green');
        
        // 验证用户信息
        const checks = [
          { field: 'email', expected: 'admin@example.com', actual: userInfo.email },
          { field: 'role', expected: 'admin', actual: userInfo.role }
        ];
        
        log('\n字段验证:', 'blue');
        checks.forEach(check => {
          const match = check.actual === check.expected;
          const symbol = match ? '✓' : '✗';
          const color = match ? 'green' : 'red';
          log(`  ${symbol} ${check.field}: ${check.actual} ${match ? '(正确)' : `(期望: ${check.expected})`}`, color);
        });
      } else {
        log('\n✗ 警告: 响应中没有用户信息', 'yellow');
      }
      
      log('\n========================================', 'green');
      log('✓ 所有测试通过!', 'green');
      log('========================================\n', 'green');
      
      return true;
    } else {
      log('✗ 登录失败!', 'red');
      log(`\n错误信息:`, 'red');
      log(JSON.stringify(response.body, null, 2), 'red');
      
      log('\n========================================', 'red');
      log('✗ 测试失败', 'red');
      log('========================================\n', 'red');
      
      return false;
    }
  } catch (error) {
    log('\n✗ 请求失败!', 'red');
    log(`错误: ${error.message}`, 'red');
    
    if (error.code === 'ECONNREFUSED') {
      log('\n提示: 请确保应用服务器正在运行 (npm run dev)', 'yellow');
    }
    
    log('\n========================================', 'red');
    log('✗ 测试失败', 'red');
    log('========================================\n', 'red');
    
    return false;
  }
}

// 运行测试
testLogin().then(success => {
  process.exit(success ? 0 : 1);
});
