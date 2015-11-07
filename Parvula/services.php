<?php
// ----------------------------- //
// Register services
// ----------------------------- //

use Parvula\Core\Container;

$app->share('errorHandler', function () {
	if (class_exists('\\Whoops\\Run')) {
		$whoops = new Whoops\Run();
		$whoops->pushHandler(new Whoops\Handler\PrettyPageHandler());
		$jsonHandler = new Whoops\Handler\JsonResponseHandler();
		$jsonHandler->onlyForAjaxRequests(true);
		$whoops->pushHandler($jsonHandler);

		$whoops->register();
	} else {
		// Use custom exception handler
		set_exception_handler('exceptionHandler');
	}
});

$app->share('config', function () {
	// Populate Config wrapper
	return new Parvula\Core\Config(require APP . 'config.php');
});

$app->add('fileParser', function () {
	$parsers = [
		'json' => new \Parvula\Core\Parser\Json,
		'yaml' => new \Parvula\Core\Parser\Yaml,
		'php' => new \Parvula\Core\Parser\Php
	];

	return new Parvula\Core\Model\FileParser($parsers);
});

$app->share('plugins', function (Container $this) {
	$pluginMediator = new Parvula\Core\PluginMediator;
	$pluginMediator->attach(getPluginList($this['config']->get('disabledPlugins')));
	return $pluginMediator;
});

$app->share('request', function () {
	parse_str(file_get_contents("php://input"), $post_vars);

	return new Parvula\Core\Router\Request(
		$_SERVER,
		$_GET,
		$post_vars,
		$_COOKIE,
		$_FILES
	);
});

$app->share('session', function () {
	$session = new Parvula\Core\Session('parvula.');
	$session->start();
	return $session;
});

//-- ModelMapper --

$app->add('users', function (Container $this) {
	return new Parvula\Core\Model\Mapper\Users($this['fileParser'], DATA . 'users/users.php');
});

$app->add('pages', function (Container $this) {
	$fileExtension =  '.' . $this['config']->get('fileExtension');
	$pageSerializer = $this['config']->get('pageSerializer');
	$contentParser = $this['config']->get('contentParser');

	return new Parvula\Core\Model\Mapper\PagesFlatFiles(
		new $contentParser, new $pageSerializer, $fileExtension);
});

$app->add('themes', function (Container $this) {
	return new Parvula\Core\Model\Mapper\Themes(THEMES, $this['fileParser']);
});

$app->add('theme', function (Container $this) {
	if ($this['themes']->has($themeName = $this['config']->get('theme'))) {
		return $this['themes']->read($themeName);
	} else {
		throw new Exception('Theme `' . $themeName . '` does not exists');
	}
});

$app->add('view', function (Container $this) {
	$theme = $this['theme'];

	// Create new Plates instance to render theme files
	$view = new League\Plates\Engine($theme->getPath(), $theme->getExtension());

	// Register theme folders
	$iter = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator($theme->getPath(), RecursiveDirectoryIterator::SKIP_DOTS),
			RecursiveIteratorIterator::SELF_FIRST, RecursiveIteratorIterator::CATCH_GET_CHILD
	);
	$baseLen = strlen($theme->getPath());
	foreach ($iter as $path => $dir) {
		if ($dir->isDir()){
			$name = str_replace([DIRECTORY_SEPARATOR, '/', '\\'], '|', substr($path, $baseLen));
			// Register '_*' folders exept '_layouts' (registered the 'layout' theme config)
			if ($name[0] === '_' && $name !== '_layouts') {
				$view->addFolder(substr($name, 1), $path);
			}
		}
	}

	// Register 'layouts' with the layouts folder (in the theme config)
	$view->addFolder('layouts', $theme->getPath() . $theme->getLayoutFolder());

	return $view;
});
