/**
 * notify - jQuery notification system
 * v1.0
 * @author Sujeet <sujeetkv90@gmail.com>
 * @link https://github.com/sujeet-kumar/jquery-notify
 */

(function($){
	$.notify = (function($){
		var _color = {
			'info': '#31708F',
			'success': '#3C763D',
			'warning': '#8A6D3B',
			'error': '#A94442'
		};
		
		var _bg_color = {
			'info': '#D9EDF7',
			'success': '#DFF0D8',
			'warning': '#FCF8E3',
			'error': '#F2DEDE'
		};
		
		var _settings = {
			'app_title': '',
			'app_icon': '',
			'position': {
				'ver': 'bottom',
				'hor': 'right'
			},
			'container_layout': '<div style="padding:5px; margin:0px; width:400px;"></div>',
			'message_layout': '<div style="border-radius:8px; box-shadow:0 0 5px rgba(51, 51, 51, 0.4); font-weight:bold; padding:10px; margin:8px 5px;"></div>'
		};
		
		var _permissions = {
			DEFAULT: 'default',
			GRANTED: 'granted',
			DENIED: 'denied'
		};
		
		var _remove = function($node){
			$node.fadeOut('fast', function(){
				$(this).remove();
			});
		};
		
		var _container = function(){
			if(!($('div#__notify_container').length)){
				var $_container_layout = $(_settings.container_layout);
				$_container_layout.attr('id', '__notify_container');
				
				var _container_css = {
					'z-index': '1024',
					'position': 'fixed'
				};
				_container_css[_settings.position.ver] = '0';
				_container_css[_settings.position.hor] = '0';
				$_container_layout.css(_container_css);
				
				$('body').append($_container_layout);
			}
			return $('div#__notify_container');
		};
		
		var _remove_msg = function($node){
			if(_container().children().length < 2){
				_remove(_container());
			}else{
				_remove($node);
			}
		};
		
		var _template = function(type, msg, temp){
			temp = (typeof temp == 'undefined') ? true : temp;
			
			var $tpl = $(_settings.message_layout);
			$tpl.html(msg);
			$tpl.addClass('__notify_msg '+type);
			$tpl.css({'color': _color[type], 'background-color': _bg_color[type], 'border': '1px solid '+_color[type]});
			
			if(temp){
				$tpl.css({'cursor': 'pointer'});
				$tpl.click(function(e){
					e.stopPropagation();
					_remove_msg($(this));
				});
				
				if(parseInt(temp) > 1){
					setTimeout(function(){
						_remove_msg($tpl);
					}, parseInt(temp) * 1000);
				}
			}
			
			return $tpl;
		};
		
		var _default_api = {
			'info': function(msg, temp){
				_container().append(_template('info', msg, temp));
			},
			'success': function(msg, temp){
				_container().append(_template('success', msg, temp));
			},
			'warning': function(msg, temp){
				_container().append(_template('warning', msg, temp));
			},
			'error': function(msg, temp){
				_container().append(_template('error', msg, temp));
			},
			'clear': function(){
				_remove(_container());
			}
		};
		
		var _sys_alerts = [];
		
		var _notify_system = function(type, msg, temp){
			var _title = $.trim(_settings.app_title + ' Alert: ' + type.charAt(0).toUpperCase() + type.substr(1));
			
			var _options = {body: msg};
			if(_settings.app_icon) _options.icon = _settings.app_icon;
			
			var _n = new Notification(_title, _options);
			if(parseInt(temp) > 1){
				setTimeout(_n.close.bind(_n), parseInt(temp) * 1000);
			}
			_sys_alerts.push(_n);
		};
		
		var _system_alert = function(type, msg, temp){
			if('Notification' in window){
				if(Notification.permission === _permissions.GRANTED){
					_notify_system(type, msg, temp);
				}else if(Notification.permission !== _permissions.DENIED){
					Notification.requestPermission(function(permission){
						if(permission === _permissions.GRANTED){
							_notify_system(type, msg, temp);
						}else{
							_default_api[type](msg, temp);
						}
					});
				}else{
					_default_api[type](msg, temp);
				}
			}else{
				_default_api[type](msg, temp);
			}
		};
		
		var _system_alert_clear = function(){
			if('Notification' in window && Notification.permission === _permissions.GRANTED){
				for(var _i in _sys_alerts){
					_sys_alerts[_i].close();
				}
			}else{
				_default_api.clear();
			}
		};
		
		_default_api.system = {
			'info': function(msg, temp){
				_system_alert('info', msg, temp);
			},
			'success': function(msg, temp){
				_system_alert('success', msg, temp);
			},
			'warning': function(msg, temp){
				_system_alert('warning', msg, temp);
			},
			'error': function(msg, temp){
				_system_alert('error', msg, temp);
			},
			'clear': function(){
				_system_alert_clear();
			}
		};
		
		_default_api.setup = function(options){
			if(options.app_title) _settings.app_title = options.app_title;
			if(options.app_icon) _settings.app_icon = options.app_icon;
			if(options.container_layout) _settings.container_layout = options.container_layout;
			if(options.message_layout) _settings.message_layout = options.message_layout;
			if(options.position && options.position.ver) _settings.position.ver = options.position.ver;
			if(options.position && options.position.hor) _settings.position.hor = options.position.hor;
		};
		
		return _default_api;
	})($);
}(jQuery));
