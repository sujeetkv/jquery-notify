/**
 * notify - jQuery notification system
 * v2.0
 * 
 * @author Sujeet <sujeetkv90@gmail.com>
 * @link https://github.com/sujeet-kumar/jquery-notify
 */

(function ($) {
    $.notify = (function () {
        var color = {
            'info': '#31708F',
            'success': '#3C763D',
            'warning': '#8A6D3B',
            'error': '#A94442'
        };
        
        var bg_color = {
            'info': '#D9EDF7',
            'success': '#DFF0D8',
            'warning': '#FCF8E3',
            'error': '#F2DEDE'
        };
        
        var settings = {
            'app_title': '',
            'app_icon': '',
            'position': {
                'ver': 'bottom',
                'hor': 'right'
            },
            'z_index': '2048',
            'container_layout': '<div style="padding:5px; margin:0px; width:400px;"></div>',
            'message_layout': '<div style="border-radius:8px; box-shadow:0 0 5px rgba(51, 51, 51, 0.4); font-weight:bold; padding:10px; margin:8px 5px;"></div>',
            'service_worker_path': '',
            'verbose_mode': false
        };
        
        var log = function (msg) {
            if (settings.verbose_mode && console && 'log' in console) {
                console.log('notify.js:> ' + msg);
            }
        };
        
        var container = function () {
            if (!$('div#__notifycontainer').length) {
                var $container_layout = $(settings.container_layout);
                $container_layout.attr('id', '__notifycontainer');
                
                var container_css = {
                    'z-index': settings.z_index,
                    'position': 'fixed'
                };
                container_css[settings.position.ver] = '0';
                container_css[settings.position.hor] = '0';
                $container_layout.css(container_css);
                
                $('body').append($container_layout);
            }
            return $('div#__notifycontainer');
        };
        
        var remove = function ($element) {
            $element.fadeOut('fast', function () {
                $(this).remove();
            });
        };
        
        var remove_msg = function ($msg_element) {
            if (container().children().length < 2) {
                remove(container());
            } else {
                remove($msg_element);
            }
        };
        
        var template = function (type, msg, temp) {
            temp = (typeof temp == 'undefined') ? true : temp;
            
            var $tpl = $(settings.message_layout);
            $tpl.html(msg);
            $tpl.addClass('__notify_msg ' + type);
            $tpl.css({'color': color[type], 'background-color': bg_color[type], 'border': '1px solid ' + color[type]});
            
            if (temp) {
                $tpl.css({'cursor': 'pointer'});
                $tpl.click(function (e) {
                    e.stopPropagation();
                    remove_msg($(this));
                });
                
                if (parseInt(temp) > 1) {
                    setTimeout(function () {
                        remove_msg($tpl);
                    }, parseInt(temp) * 1000);
                }
            }
            return $tpl;
        };
        
        var default_api = {
            'info': function (msg, temp) {
                var $msg_tpl = template('info', msg, temp);
                container().append($msg_tpl);
                return {
                    'remove': function () {
                        remove_msg($msg_tpl);
                    }
                };
            },
            'success': function (msg, temp) {
                var $msg_tpl = template('success', msg, temp);
                container().append($msg_tpl);
                return {
                    'remove': function () {
                        remove_msg($msg_tpl);
                    }
                };
            },
            'warning': function (msg, temp) {
                var $msg_tpl = template('warning', msg, temp);
                container().append($msg_tpl);
                return {
                    'remove': function () {
                        remove_msg($msg_tpl);
                    }
                };
            },
            'error': function (msg, temp) {
                var $msg_tpl = template('error', msg, temp);
                container().append($msg_tpl);
                return {
                    'remove': function () {
                        remove_msg($msg_tpl);
                    }
                };
            },
            'clear': function () {
                remove(container());
            }
        };
        
        var has_service_worker = false;
        
        var permissions = {
            DEFAULT: 'default',
            GRANTED: 'granted',
            DENIED: 'denied'
        };
        
        var sys_alert_pool = [];
        
        var registerServiceWorker = function (service_worker_path) {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register(service_worker_path).then(function (registration) {
                    has_service_worker = true;
                    log('serviceWorker registration successful having scope: ' + registration.scope);
                }).catch(function (err) {
                    has_service_worker = false;
                    log('serviceWorker registration warning: ' + err);
                });
            } else {
                log('serviceWorker not supported.');
            }
        };
        
        var notify_system = function (type, msg, temp, title, icon) {
            temp = (typeof temp === 'undefined') ? true : temp;
            title = title || $.trim(settings.app_title + ': ' + type.charAt(0).toUpperCase() + type.substr(1));
            icon = icon || settings.app_icon;
            
            var options = {body: msg};
            
            if (icon) {
                options.icon = icon;
            }
            
            if (!temp) {
                options.requireInteraction = true;
            }
            
            if (has_service_worker === true) {
                navigator.serviceWorker.ready.then(function (registration) {
                    
                    registration.showNotification(title, options).then(function () {
                        
                        registration.getNotifications().then(function (notifications) {
                            if (notifications.length) {
                                var n = notifications[notifications.length - 1];
                                if (parseInt(temp) > 1) {
                                    setTimeout(n.close.bind(n), parseInt(temp) * 1000);
                                }
                                sys_alert_pool.push(n);
                            }
                        });
                        
                    });
                    
                });
            } else {
                var n = new Notification(title, options);
                if (parseInt(temp) > 1) {
                    setTimeout(n.close.bind(n), parseInt(temp) * 1000);
                }
                sys_alert_pool.push(n);
            }
        };
        
        var system_alert = function (type, msg, temp, title, icon) {
            if ('Notification' in window) {
                if (Notification.permission === permissions.GRANTED) {
                    notify_system(type, msg, temp, title, icon);
                } else if (Notification.permission !== permissions.DENIED && Notification.requestPermission) {
                    Notification.requestPermission(function (permission) {
                        permissionRequestCallback(permission);
                        
                        if (permission === permissions.GRANTED) {
                            notify_system(type, msg, temp, title, icon);
                        } else {
                            default_api[type](msg, temp);
                        }
                    });
                } else {
                    default_api[type](msg, temp);
                    log('System Notification not allowed.');
                }
            } else {
                default_api[type](msg, temp);
                log('System Notification not supported.');
            }
        };
        
        var system_alert_clear = function () {
            if ('Notification' in window && Notification.permission === permissions.GRANTED) {
                for (var i in sys_alert_pool) {
                    sys_alert_pool[i].close();
                }
            } else {
                default_api.clear();
            }
        };
        
        default_api.system = {
            'info': function (msg, temp, title, icon) {
                system_alert('info', msg, temp, title, icon);
            },
            'success': function (msg, temp, title, icon) {
                system_alert('success', msg, temp, title, icon);
            },
            'warning': function (msg, temp, title, icon) {
                system_alert('warning', msg, temp, title, icon);
            },
            'error': function (msg, temp, title, icon) {
                system_alert('error', msg, temp, title, icon);
            },
            'clear': function () {
                system_alert_clear();
            }
        };
        
        default_api.system.onPermissionGranted = function () {};
        default_api.system.onPermissionDenied = function () {};
        
        var permissionRequestCallback = function (permission, onGrantedCallback, onDeniedCallback) {
            onGrantedCallback = onGrantedCallback || default_api.system.onPermissionGranted;
            onDeniedCallback = onDeniedCallback || default_api.system.onPermissionDenied;

            switch (permission) {
                case permissions.GRANTED:
                    log('Permission Granted !');
                    if (typeof onGrantedCallback === 'function') {
                        onGrantedCallback();
                    }
                    break;
                case permissions.DENIED:
                    log('Permission Denied !');
                    if (typeof onDeniedCallback === 'function') {
                        onDeniedCallback();
                    }
                    break;
            };
        };
        
        default_api.system.requestPermission = function (onGranted, onDenied) {
            if ('Notification' in window && Notification.permission && Notification.requestPermission) {
                if (Notification.permission === permissions.DEFAULT) {
                    Notification.requestPermission(function (permission) {
                        permissionRequestCallback(permission, onGranted, onDenied);
                    });
                } else {
                    log('Permission already requested: ' + Notification.permission.toUpperCase());
                }
            } else {
                log('System Notification not supported.');
            }
        };
        
        default_api.setup = function (options) {
            if (options.app_title) {
                settings.app_title = options.app_title;
            }
            if (options.app_icon) {
                settings.app_icon = options.app_icon;
            }
            if (options.container_layout) {
                settings.container_layout = options.container_layout;
            }
            if (options.message_layout) {
                settings.message_layout = options.message_layout;
            }
            if (options.position && options.position.ver) {
                settings.position.ver = options.position.ver;
            }
            if (options.position && options.position.hor) {
                settings.position.hor = options.position.hor;
            }
            if (options.z_index) {
                settings.z_index = options.z_index;
            }
            if (options.service_worker_path) {
                registerServiceWorker(options.service_worker_path);
            }
            if ('verbose_mode' in options) {
                settings.verbose_mode = !!options.verbose_mode;
            }
        };
        
        return default_api;
    })();
}(jQuery));
