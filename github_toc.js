// ==UserScript==
// @name        github_toc
// @namespace   github
// @description create toc for readme.md
// @include     https://github.com/*
// @require     http://code.jquery.com/jquery-2.1.1.min.js
// @require     http://www.ztree.me/v3/js/jquery.ztree.core-3.5.js
// @resource    zTreeStyle    http://www.ztree.me/v3/css/zTreeStyle/zTreeStyle.css
// @resource    line_conn.gif    http://www.ztree.me/v3/css/zTreeStyle/img/line_conn.gif
// @resource    zTreeStandard.png    http://www.ztree.me/v3/css/zTreeStyle/img/zTreeStandard.png  
// @version     2
// @grant       GM_getResourceText
// @grant       GM_getResourceURL
// ==/UserScript==
$(function () {
    var containerId = 'tree_container';
    var getNodes = function () {
        return $('#readme>article').children('h1,h2,h3,h4,h5,h6');
    };
    var createToc = function () {
        var nodes = getNodes();
        if (nodes.length) {
            var container = $('#' + containerId);
            if (!$('#ztree_style')[0]) {
                (function () {
                    var head = document.getElementsByTagName('head') [0];
                    var style = document.createElement('style');
                    style.id = 'ztree_style';
                    style.type = 'text/css';
                    var css = GM_getResourceText('zTreeStyle');
                    var resources = [
                        'line_conn.gif',
                        'zTreeStandard.png'
                    ];
                    resources.forEach(function (name) {
                        css = css.replace('./img/' + name, GM_getResourceURL(name));
                    });
                    style.innerHTML = css;
                    head.appendChild(style);
                })();
            }


            var stack = [];
            var result = [];
            var offset = [];
            var index = 1;
            nodes.each(function () {
                var node = $(this);
                var obj = {};
                var x = +this.tagName.toUpperCase().replace('H', '');
                var xobj = {
                    obj: obj,
                    x: x,
                    node: node
                };
                var flag = true;
                while (flag) {
                    var last = stack[stack.length - 1];
                    if (!last) {
                        obj.index = index + '.';
                        stack.push(xobj);
                        result.push(obj);
                        index++;
                        break;
                    } else {
                        if (x > last.x) { // 子节点
                            stack.push(xobj);
                            if (!last.obj.children) {
                                last.obj.children = [];
                            }
                            obj.index = last.obj.index + (last.obj.children.length + 1) + '.';
                            last.obj.children.push(obj);
                            break;
                        } else {
                            stack.pop();
                        }
                    }
                }
                if(!node.attr('data-num_cache')) {
                    node.attr('data-num_cache', node.text());
                }
                var _index = 'toc_' + obj.index;
                var _id = 'h_' + _index.replace(/\./g, '_');
                obj.name = obj.index + node.attr('data-num_cache');
                obj.id =
                    obj.url = '#' + _id;
                obj.target = '_self';
                node[0].id = _id;
                node.text(obj.name);
                offset.push([node.offset().top, node]);
            });
            if (!container[0]) {
                var html = '';
                html += '<div id="tree_container" style="height:100%;top: 0; background: #fff; position: fixed; right: 0px; border: 1px solid #ddd; width: 400px; overflow: scroll;box-shadow: -2px -2px 10px rgba(0, 0, 0, 0.5);">';
                html += '    <div id="toc_header" style="position:fixed;z-index:2;width:400px;height:32px;line-height:32px;text-align: center;font-size: 24px;background: #ddd;border-bottom: 1px solid #aaa;">';
                html += '        目录';
                html += '    </div>';
                html += '    <div id="toc_tree" class="ztree" style="height:100%;padding-top:34px;"></div>';
                html += '</div>'
                html += '<a href="#" id="toggle_toc" style="position: fixed;right:10px;font-size: 14px;z-index: 2;top: 7px;">收起目录</a>';
                $(document.body).append(html);
            }
            var treeId = 'toc_tree';
            $.fn.zTree.init($('#' + treeId), {
                view: {
                    dblClickExpand: false,
                    showLine: true,
                    showIcon: false,
                    selectedMulti: false
                },
                data: {
                },
                callback: {
                    beforeClick: function (treeId, treeNode) {
                        $('a.curSelectedNode', '#' + containerId).removeClass('curSelectedNode');
                    }
                }
            }, result);

            var tree = $.fn.zTree.getZTreeObj(treeId);
            tree.expandAll(true);

            scrollHighlight(offset);
            $(window).unbind('scroll.toc').bind('scroll.toc', function() {
                scrollHighlight(offset);
            });
            
            $('#toggle_toc').click(function() {
                var btn = $(this);
                var container = $('#' + containerId);
                if(container.is(':visible')) {
                    container.slideUp(function() {
                        btn.text('展开目录');
                    });
                } else {
                    container.slideDown(function() {
                        btn.text('收起目录');
                    });
                }
                return false;
            });
        }
    };

    var binarySearch = function (x, arr) {
        var low = 0;
        var high = arr.length - 1;
        var mid;
        var mv;
        if(x < arr[low][0]) {
            return low;
        } else if(x > arr[high][0]) {
            return high;
        }
        while (low <= high) {
            mid = Math.floor((low + high) / 2);
            mv = arr[mid][0];
            if (x < mv + 20 && x > mv - 20) {
                return mid;
            } else if (x < mv) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return x > mv ? mid + 1 : mid;
    };

    var scrollHighlight = function (arr) {
        var top = $(document).scrollTop();
        var index = binarySearch(top, arr);
        var item = arr[index];
        $('a.curSelectedNode', '#' + containerId).removeClass('curSelectedNode');
        $('a[href=#' + item[1][0].id + ']').addClass('curSelectedNode');
        return item;
    };

    createToc();

    unsafeWindow.$(unsafeWindow.document).on('pjax:end', function (e) {
        var nodes = getNodes();
        if (nodes.length) {
            createToc();
        } else {
            $.fn.zTree.destroy();
            $('#' + containerId).remove();
        }
    });
});
