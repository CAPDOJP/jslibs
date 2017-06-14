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
		currentlocation:null,
		map:null,
		config:{},
		markers:[]
	};
	var events={
		lists:[
			'app.record.index.show',
			'mobile.app.record.index.show'
		],
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
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* check display map */
		if (!'map' in vars.config) return event;
		if (vars.config['map']!='1') return event;
		/* create currentlocation box */
		vars.currentlocation=$('<label class="customview-checker">')
		.append('<input type="checkbox" id="addcurrentlocation">').on('change',function(e){
			if ($(this).prop('checked'))
			{
				vars.map.currentlocation({callback:function(latlng){
					var markers=vars.markers;
					/* start from current location */
					markers.push({
						label:'現在地',
						lat:latlng.lat(),
						lng:latlng.lng()
					});
					/* display map */
					vars.map.reloadmap({markers:markers});
				}});
			}
			else
			{
				/* display map */
				vars.map.reloadmap({markers:vars.markers});
			}
		})
		.append('<button type="button" class="customview-checkerbutton">現在地を表示</button>');
		/* create map controller */
		var mapcontainer=$('<div id="map">');
		vars.map=mapcontainer.css({'height':'50vh','width':'100%'}).routemap(vars.config['apikey'],false,false,function(){
			/* create map */
			$.each(event.records,function(index,values){
				var record=values
				var lat=parseFloat('0'+record[vars.config['lat']].value);
				var lng=parseFloat('0'+record[vars.config['lng']].value);
				if (lat+lng!=0)
					vars.markers.push({
						colors:1,
						label:(vars.config['information'])?record[vars.config['information']].value:record[vars.config['address']].value,
						lat:lat,
						lng:lng
					});
			});
			if (vars.markers.length==0) return;
			/* display map */
			vars.map.reloadmap({markers:vars.markers});
		});
		/* append elements */
		kintone.app.getHeaderMenuSpaceElement().appendChild(vars.currentlocation[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(mapcontainer[0]);
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* hide elements  */
		kintone.app.record.setFieldShown(vars.config['lat'],false);
		kintone.app.record.setFieldShown(vars.config['lng'],false);
		/* map action  */
		vars.map=$('<div id="map">').css({'height':'100%','width':'100%'});
		/* the initial display when editing */
		if (event.type.match(/(edit|detail)/g)!=null) functions.displaymap({latlng:event.record.lat.value+','+event.record.lng.value});
		/* display map in value change event */
		if (event.type.match(/(create|edit)/g)!=null)
			$('body').fields(vars.config['address'])[0].on('change',function(){
				var target=$(this);
				functions.displaymap({
					address:target.val(),
					callback:function(json){
						$('body').fields(vars.config['lat'])[0].val(json.results[0].geometry.location.lat);
						$('body').fields(vars.config['lng'])[0].val(json.results[0].geometry.location.lng);
					}
				});
			});
		kintone.app.record.getSpaceElement(vars.config['spacer']).appendChild(vars.map[0]);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
