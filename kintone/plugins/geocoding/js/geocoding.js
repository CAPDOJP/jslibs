/*
*--------------------------------------------------------------------
* jQuery-Plugin "geocoding"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		map:null
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'app.record.detail.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show',
			'mobile.app.record.detail.show'
		]
	};
	var functions={
		/* display map */
		displaymap:function(options){
			var options=$.extend({
				address:'',
				latlng:'',
				callback:null
			},options);
			if (options.address.length!=0)
				$.ajax({
					url:'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&language=ja&address='+encodeURI(options.address),
					type:'get',
					datatype:'json',
					error:function(){alert('地図座標取得に失敗しました。');},
					success:function(json){
						switch (json.status)
						{
							case 'ZERO_RESULTS':
								break;
							case 'OVER_QUERY_LIMIT':
								alert('リクエストが割り当て量を超えています。');
								break;
							case 'REQUEST_DENIED':
								alert('リクエストが拒否されました。');
								break;
							case 'INVALID_REQUEST':
								alert('クエリが不足しています。');
								break;
							case 'OK':
								var latlng=json.results[0].geometry.location.lat+','+json.results[0].geometry.location.lng;
								var src='https://maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+encodeURI(options.address)+'@'+latlng+'&amp;ie=UTF8&amp;ll='+latlng+'&amp;z=14&amp;t=m&amp;output=embed';
								vars.map.empty();
								vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
								if (options.callback!=null) options.callback(json);
								break;
						}
					}
				});
			if (options.latlng.length!=0)
			{
				var src='https://maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+options.latlng+'&amp;ie=UTF8&amp;ll='+options.latlng+'&amp;z=14&amp;t=m&amp;output=embed';
				vars.map.empty();
				vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
			}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!config) return false;
		/* hide elements  */
		kintone.app.record.setFieldShown(config['lat'],false);
		kintone.app.record.setFieldShown(config['lng'],false);
		/* map action  */
		vars.map=$('<div id="map">').css({'height':'100%','width':'100%'});
		/* the initial display when editing */
		if (event.type.match(/(edit|detail)/g)!=null) functions.displaymap({latlng:event.record.lat.value+','+event.record.lng.value});
		/* display map in value change event */
		if (event.type.match(/(create|edit)/g)!=null)
			$('body').fields(config['address'])[0].on('change',function(){
				var target=$(this);
				functions.displaymap({
					address:target.val(),
					callback:function(json){
						$('body').fields(config['lat'])[0].val(json.results[0].geometry.location.lat);
						$('body').fields(config['lng'])[0].val(json.results[0].geometry.location.lng);
					}
				});
			});
		kintone.app.record.getSpaceElement(config['spacer']).appendChild(vars.map[0]);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
