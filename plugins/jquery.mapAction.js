/*
*--------------------------------------------------------------------
* jQuery-Plugin "mapAction"
* Version: 3.0
* Copyright (c) 2014 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
(function($){
/*
*--------------------------------------------------------------------
* 静的地図生成
*--------------------------------------------------------------------
* parameters
* options @ address  :座標を取得する住所
*         @ latlng   :緯度経度
*         @ callback :コールバック関数
* -------------------------------------------------------------------
*/
jQuery.fn.staticMapAction = function(options){
	var options=$.extend({
		address:'',
		latlng:'',
		callback:null
	},options);
	var target=$(this);
	if (options.address.length!=0)
		$.ajax({
			url:window.location.protocol+'//maps.googleapis.com/maps/api/geocode/json?sensor=false&language=ja&address='+encodeURI(options.address),
			type:'get',
			datatype:'json'
		})
		.done(function(json){
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
					var src=window.location.protocol+'//maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+encodeURI(options.address)+'@'+latlng+'&amp;ie=UTF8&amp;ll='+latlng+'&amp;z=14&amp;t=m&amp;output=embed';
					target.empty();
					target.append('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>');
					if (options.callback!=null) options.callback(json);
					break;
			}
		})
		.fail(function(){alert('地図座標取得に失敗しました。');});
	if (options.latlng.length!=0)
	{
		var src=window.location.protocol+'//maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+options.latlng+'&amp;ie=UTF8&amp;ll='+options.latlng+'&amp;z=14&amp;t=m&amp;output=embed';
		target.empty();
		target.append('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>');
	}
}
})(jQuery);
/*
*--------------------------------------------------------------------
* 動的地図生成
*--------------------------------------------------------------------
*/
/* コンストラクタ */
var DynamicMap=function(options){
	var options=$.extend({
		display:null,
		route:null,
		idle:null
	},options);
	if (options.display==null) {alert('地図表示用ボックスを指定して下さい。');return;}
	var latlng=new google.maps.LatLng(0,0);
	var param={
		center:latlng,
		mapTypeControl:false,
		overviewMapControl:false,
		panControl:true,
		scaleControl:false,
		streetViewControl:false,
		zoomControl:true,
		zoom:14
	};
	this.displaybox=options.display;
	this.routingbox=options.route;
	this.locations=[];
	this.markers=[];
	this.balloons=[];
	this.colors=[
		{name:'レッド',back:'e60012',fore:'000000'},
		{name:'オレンジ',back:'f39700',fore:'000000'},
		{name:'シルバー',back:'9caeb7',fore:'000000'},
		{name:'ブルー',back:'0079c2',fore:'ffffff'},
		{name:'グリーン',back:'009944',fore:'000000'},
		{name:'ゴールド',back:'d7c447',fore:'000000'},
		{name:'スカイ',back:'00a7db',fore:'000000'	},
		{name:'パープル',back:'9b7cb6',fore:'000000'},
		{name:'エメラルド',back:'00ada9',fore:'000000'},
		{name:'ブラウン',back:'bb641d',fore:'000000'},
		{name:'ローズ',back:'e85298',fore:'000000'},
		{name:'リーフ',back:'6cbb5a',fore:'000000'},
		{name:'ルビー',back:'b6007a',fore:'ffffff'},
		{name:'臙脂',back:'e5171f',fore:'000000'},
		{name:'京紫',back:'522886',fore:'ffffff'},
		{name:'縹',back:'0078ba',fore:'ffffff'},
		{name:'緑',back:'019a66',fore:'000000'},
		{name:'紅梅',back:'e44d93',fore:'000000'},
		{name:'マルーン',back:'814721',fore:'ffffff'},
		{name:'萌黄',back:'a9cc51',fore:'000000'},
		{name:'柑子',back:'ee7b1a',fore:'000000'},
		{name:'セルリアンブルー',back:'00a0de',fore:'000000'},
		{name:'ホワイト',back:'ffffff',fore:'000000'}
	];
	this.map=new google.maps.Map(document.getElementById(this.displaybox.attr('id')),param);
	this.directionsRenderer=new google.maps.DirectionsRenderer({suppressMarkers:true});
	this.directionsService=new google.maps.DirectionsService();
	this.travelmode=google.maps.TravelMode.DRIVING;
	if (options.idle!=null) google.maps.event.addListener(this.map,'idle',function(){options.idle();});
};
/* 関数定義 */
DynamicMap.prototype={
	/*現在地取得*/
	currentlocation:function(options){
		var options=$.extend({
			callback:null
		},options);
		if (navigator.geolocation)
		{
			var userAgent=window.navigator.userAgent.toLowerCase();
			if (userAgent.indexOf('msie')!=-1 || userAgent.indexOf('trident')!=-1) alert('Internet Explorerでは正常に動作しません。\nMicrosoft Edgeかその他のブラウザを利用して下さい。');
			navigator.geolocation.getCurrentPosition(
				function(pos){
					if (options.callback!=null) options.callback(new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude));
				},
				function(error){
					alert('位置情報の取得に失敗しました。\n'+error.message);
				},
				{
					enableHighAccuracy:true,
					maximumAge:0,
					timeout:10000
				}
			);
		}
		else {alert('お使いのブラウザでは位置情報が取得出来ません。');}
	},
	/*地図再読込*/
	reloadmap:function(options){
		var options=$.extend({
			markers:this.locations,
			type:'marking',
			callback:null
		},options);
		var colors=this.colors;
		var map=this.map;
		var renderer=this.directionsRenderer;
		var service=this.directionsService;
		var routing=this.routingbox;
		var markers=[];
		var balloons=[];
		/*位置情報初期化*/
		this.locations=options.markers;
		/*マーカー初期化*/
		$.each(this.markers,function(index,values){values.setMap(null);});
		this.markers=[];
		markers=this.markers;
		/*吹き出し初期化*/
		$.each(this.balloons,function(index,values){values.setMap(null);});
		this.balloons=[];
		balloons=this.balloons;
		/*ルート初期化*/
		renderer.setMap(null);
		var addmarker=function(latlng,childindex,colorsindex,label){
			/*マーカー配置*/
			var marker=new google.maps.Marker({
				map:map,
				position:latlng,
				icon:'https://chart.apis.google.com/chart?chst=d_map_pin_letter_withshadow&chld='+childindex.toString()+'|'+colors[colorsindex].back+'|'+colors[colorsindex].fore
			});
			markers.push(marker);
			/*吹き出し配置*/
			if (label.length!=0)
			{
				var balloon=new google.maps.InfoWindow({content:label,disableAutoPan:true});
				balloon.open(map,marker);
				google.maps.event.addListener(marker,'click',function(event){
					if (!balloon.getMap()) balloon.open(map,marker);
				});
				balloons.push(balloon);
			}
		};
		switch (options.type)
		{
			case 'marking':
				$.each(options.markers,function(index,values){
					var values=$.extend({
						colors:0,
						label:'',
						lat:0,
						lng:0
					},values);
					/*マーカー配置*/
					addmarker(new google.maps.LatLng(values.lat,values.lng),index+1,values.colors,values.label);
				});
				if (options.callback!=null) options.callback();
				break;
			case 'routing':
				switch (options.markers.length)
				{
					case 0:
						break;
					case 1:
						/*マーカー配置*/
						var latlng=new google.maps.LatLng(options.markers[0].lat,options.markers[0].lng);
						addmarker(latlng,
							1,
							(('colors' in options.markers[0])?options.markers[0].colors:0),
							(('label' in options.markers[0])?options.markers[0].label:'')
						);
						/*中心位置設定*/
						map.setCenter(latlng);
						/*ルート案内非表示*/
						if (routing!=null)
						{
							routing.empty();
							routing.hide();
						}
						if (options.callback!=null) options.callback();
						break;
					default:
						/*ルート設定*/
						var origin=null;
						var destination=null;
						var waypoints=[];
						var labels=[];
						$.each(options.markers,function(index,values){
							var values=$.extend({
								label:'',
								lat:0,
								lng:0
							},values);
							switch (index)
							{
								case 0:
									origin=new google.maps.LatLng(values.lat,values.lng);
									break;
								case options.markers.length-1:
									destination=new google.maps.LatLng(values.lat,values.lng);
									break;
								default:
									waypoints.push({
										location:new google.maps.LatLng(values.lat,values.lng),
										stopover:true
									});
									break;
							}
							labels.push((values.label.length!=0)?values.label:'');
						});
						/*中心位置設定*/
						map.setCenter(new google.maps.LatLng(options.markers[0].lat,options.markers[0].lng));
						/*ルート設定*/
						service.route({
							origin:origin,
							destination:destination,
							waypoints:waypoints,
							travelMode:this.travelmode
						},
						function(result,status){
							if (status == google.maps.DirectionsStatus.OK)
							{
								$.each(options.markers,function(index,values){
									var values=$.extend({
										colors:0,
										label:'',
										lat:0,
										lng:0
									},values);
									/*マーカー配置*/
									addmarker(new google.maps.LatLng(values.lat,values.lng),index+1,values.colors,values.label);
								});
								renderer.setDirections(result);
								renderer.setMap(map);
								/*ルート案内表示*/
								if (routing!=null)
								{
									routing.empty();
									renderer.setPanel(document.getElementById(routing.attr('id')));
									routing.show();
								}
								if (options.callback!=null) options.callback();
							}
						});
						break;
				}
				break;
		}
	},
	/*ルート案内*/
	reloadroute:function(options){
		var options=$.extend({
			mode:'0',
			callback:null
		},options);
		switch (options.mode)
		{
			case '1':
				this.travelmode=google.maps.TravelMode.BICYCLING;
				break;
			case '2':
				this.travelmode=google.maps.TravelMode.TRANSIT;
				break;
			case '3':
				this.travelmode=google.maps.TravelMode.WALKING;
				break;
			default:
				this.travelmode=google.maps.TravelMode.DRIVING;
				break;
		}
		this.reloadmap({type:'routing'});
	},
	/*中心座標設定*/
	centering:function(options){
		var options=$.extend({
			lat:0,
			lng:0,
			callback:null
		},options);
		/*マーカー初期化*/
		$.each(this.markers,function(index,values){values.setMap(null);});
		this.markers=[];
		/*吹き出し初期化*/
		$.each(this.balloons,function(index,values){values.setMap(null);});
		this.balloons=[];
		/*ルート初期化*/
		this.directionsRenderer.setMap(null);
		this.map.setCenter(new google.maps.LatLng(options.lat,options.lng));
		if (options.callback!=null) options.callback();
	},
	/*地名取得*/
	inaddress:function(options){
		var options=$.extend({
			target:null,
			lat:0,
			lng:0,
			callback:null
		},options);
		$.ajax({
			url:'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&language=ja&latlng='+options.lat+','+options.lng,
			type:'get',
			datatype:'json'
		})
		.done(function(json){
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
					if (options.target!=null)
					{
						switch (options.target.prop('tagName').toLowerCase())
						{
							case 'input':
							case 'textarea':
								options.target.val(json.results[0].formatted_address.replace(/日本(,|、)[ ]*/g,''));
								break;
							default:
								options.target.text(json.results[0].formatted_address.replace(/日本(,|、)[ ]*/g,''));
								break;
						}
					}
					if (options.callback!=null) options.callback(json);
					break;
			}
		})
		.fail(function(){alert('地図座標取得に失敗しました。');});
	},
	/*表示領域取得*/
	inbounds:function(){
		var bounds=this.map.getBounds();
		return {
			north:bounds.getNorthEast().lat(),
			south:bounds.getSouthWest().lat(),
			east:bounds.getNorthEast().lng(),
			west:bounds.getSouthWest().lng()
		};
	},
	/*中心座標取得*/
	incenter:function(){
		return this.map.getCenter();
	}
};
