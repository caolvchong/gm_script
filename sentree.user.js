// ==UserScript==
// @name        sentree
// @namespace   sentree
// @description 盛传脚本
// @include     http://*.sentree.com.cn/shair/memberInfoSummarizing!init.action
// @version     1
// @grant       GM_xmlhttpRequest
// ==/UserScript==


var helper = {
    /**
     * post request
     * @param params
     *            url {string}
     *            data {object json}
     *            success {function(responseText)}
     */
    post: function(params) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: params.url,
            data: (function(data) {
                var arr = [];
                for(var key in data) {
                    arr.push(key + '=' + data[key]);
                }
                return arr.join('&');
            })(params.data),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            onload: function(response) {
                params.success(response.responseText);
            }
        });
    },
    /**
     * get and format data from table
     * @param text {string} page text
     */
    formatData: function(text) {
        var data;
        var div = document.createElement('div');
        div.innerHTML = text;
        var table = div.querySelector('.detailtable');
        var trList = table.querySelectorAll('tr');
        var len = trList.length;
        if(len >= 2) { // member data begin row 3
            data = [];
            for(var i = 2; i < len; i++) {
                var row = [];
                var tr = trList[i];
                var tdList = tr.querySelectorAll('td');
                for(var j = 0, jLen = tdList.length; j < jLen; j++) {
                    var td = tdList[j];
                    if(j >= 1 && j <= 5 || j === 7 || j === 9) { // 1 手机号, 2 姓名, 3 性别, 4 会员分类, 5 注册日期, 7 消费次数, 9 最后消费日
                        row.push(td.textContent.trim());
                    } else if(j === 6) { // 6 卡账户信息
                        var liList = td.querySelectorAll('li');
                        for(var k = 0, kLen = liList.length; k < kLen; k++) { // 卡号, 卡名称, 卡类型, 折扣, 卡内余额, 赠送余额, 储值总额, 消费总额
                            row.push(liList[k].textContent.trim());
                        }
                    } else if(j === 8) { // 8 当前积分
                        row.push(td.childNodes[0].value);
                    }
                }
                data.push(row.join(', '));
            }
        } else {
            data = false;
        }
        return data;
    },
    /**
     * get a page's data
     * @param page {number}
     * @param callback {function}
     */
    getMemberInfoByPage: function(page, callback) {
        helper.post({
            url: location.protocol + '//' + location.host + '/shair/memberInfo!init.action',
            data: {
                'page.currNum': page,
                'page.rpp': 15
            },
            success: function(text) {
                var data = helper.formatData(text);
                callback(data);
            }
        });
    },
    /**
     * get all page's data and save to a file
     */
    getAllMemberInfo: (function() {
        var page = 1;
        var result = [];
        result[0] = ['手机号', '姓名', '性别', '会员分类', '注册日期', '卡号', '卡名称', '卡类型', '折扣', '卡内余额', '赠送余额', '储值总额', '消费总额', '消费次数', '当前积分', '最后消费日'];

        return function() {
            helper.getMemberInfoByPage(page, function(data) {
                if(data && data.length > 0) { // has next page
                    page++;
                    for(var i = 0, len = data.length; i < len; i++) {
                        result.push(data[i]);
                    }
                    helper.getAllMemberInfo();
                } else { // save
                    helper.save(result.join('\n'));
                }
            });
        }
    })(),
    /**
     * save
     * @param data
     */
    save: function(data) {
        helper.post({
            url: 'http://192.168.57.103/data.php',
            data: {
                data: data
            },
            success: function(data) {
                //console.log('success', data);
            }
        });
    }
};

// run script
helper.getAllMemberInfo();