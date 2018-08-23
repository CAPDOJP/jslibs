/*
*--------------------------------------------------------------------
* jQuery-Plugin "autoaddition -config.js-"
* Version: 3.0
* Copyright (c) 2018 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		additiontable:null
	};
	var functions={
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'SUBTABLE':
						codes.push(values.code);
						break;
				}
			});
			return codes;
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
		var sorted=functions.fieldsort(resp.layout);
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			$.each(sorted,function(index){
				if (sorted[index] in resp.properties)
				{
					var fieldinfo=resp.properties[sorted[index]];
					$('select#addition').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.code));
				}
			});
			/* initialize valiable */
			vars.additiontable=$('.additions').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			var add=false;
			var additions=[];
			if (Object.keys(config).length!==0)
			{
				additions=JSON.parse(config['additions']);
				for (var i=0;i<additions.length;i++)
				{
					if (add) vars.additiontable.addrow();
					else add=true;
					$('select#addition',vars.additiontable.rows.last()).val(additions[i]);
				}
			}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var additions=[];
		/* check values */
		for (var i=0;i<vars.additiontable.rows.length;i++)
		{
			row=vars.additiontable.rows.eq(i);
			if ($('select#addition',row).val().length==0) continue;
			additions.push($('select#addition',row).val());
		}
		if (additions.length==0)
		{
			swal('Error!','テーブルは1つ以上指定して下さい。','error');
			return;
		}
		/* setup config */
		config['additions']=JSON.stringify(additions);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);