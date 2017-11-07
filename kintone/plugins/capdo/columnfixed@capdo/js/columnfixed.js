/*
*--------------------------------------------------------------------
* jQuery-Plugin "columnfixed"
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
		columnlist:null,
		loaded:false,
		columns:[],
		config:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		setsticky:function(){
			if (vars.columnlist)
			{
				if (vars.columnlist.val().length!=0)
				{
					var limit=vars.columns.indexOf(vars.columnlist.val())+1;
					var positions=[];
					$.each($('div#view-list-data-gaia').children('table').first().children('thead'),function(){
						var row=$(this);
						var cells=row.children('th');
						var left=0;
						for (var i=0;i<cells.length;i++)
						{
							positions.push(left);
							left+=cells.eq(i).width();
						}
					});
					$.each($('div#view-list-data-gaia').children('table'),function(){
						var table=$(this);
						$.each(table.children('thead'),function(){
							var row=$(this);
							var cells=row.children('th');
							for (var i=0;i<cells.length;i++)
							{
								if (i<limit+1) cells.eq(i).addClass('sticky').css({'left':positions[i].toString()+'px'});
								else cells.eq(i).removeClass('sticky').css({'left':'auto'});
							}
						});
						$.each(table.children('tbody').children('tr'),function(){
							var row=$(this);
							var cells=row.children('td');
							for (var i=0;i<cells.length;i++)
							{
								if (i<limit+1) cells.eq(i).addClass('sticky').css({'left':positions[i].toString()+'px'});
								else cells.eq(i).removeClass('sticky').css({'left':'auto'});
							}
						});
					})
				}
				else $('div#view-list-data-gaia').find('td,th').removeClass('sticky');
			}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		/* check view type */
		if (event.viewType.toUpperCase()!='LIST') return event;
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		kintone.proxy(
			vars.config['license']+'?domain='+$(location).attr('host').replace(/\.cybozu\.com/g,''),
			'GET',
			{},
			{},
			function(body,status,headers){
				if (status>=200 && status<300)
				{
					var json=JSON.parse(body);
					if (parseInt('0'+json.permit)==0) {swal('Error!','ライセンスが登録されていません。','error');return;}
					/* check loaded */
					if(!vars.loaded)
					{
						kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
							$.each(resp.views,function(key,values){
							    if (values.type.toUpperCase()=='LIST' && values.id==event.viewId)
							    {
									var headspace=$(kintone.app.getHeaderMenuSpaceElement());
									vars.columnlist=$('<select id="columnlist">').addClass('columnlist-select').on('change',function(){functions.setsticky();});
									/* initialize valiable */
									vars.columns=values.fields;
									/* append columns */
									vars.columnlist.append($('<option>').text('列固定フィールド').val(''));
									$.each(values.fields,function(index){
										vars.columnlist.append($('<option>').text(values.fields[index]).val(values.fields[index]));
									});
									headspace.append($('<div>').addClass('columnlist-container').append(vars.columnlist));
									vars.loaded=true;
							    }
							})
						});
					}
					$.each($('div#view-list-data-gaia').find('td'),function(){
						$(this).css({'background-color':$(this).closest('tr').css('background-color')});
					});
					$.each($('div#view-list-data-gaia').find('th'),function(index){
						$(this).css({'z-index':index.toString()});
						$(this).find('div').css({'background-color':'#FFFFFF'});
					});
					$('div#view-list-data-gaia').children('table').on('mousemove',function(){functions.setsticky();});
				}
				else swal('Error!','ライセンス認証に失敗しました。','error');
			},
			function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
		);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
