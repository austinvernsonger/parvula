<?php

namespace Parvula\Core\Model\Mapper;

use Parvula\Core\IOInterface;
use Parvula\Core\FilesSystem as Files;
use Parvula\Core\Model\Theme;
use Parvula\Core\Model\CRUDInterface;

/**
 * Themes Manager
 *
 * @package Parvula
 * @version 0.5.0
 * @since 0.5.0
 * @author Fabien Sa
 * @license MIT License
 */
class Themes implements CRUDInterface
{

	private $fs;

	private $parser;

	/**
	 * @var string Theme config // TODO
	 */
	private static $THEME_INFO_FILE = 'theme.yaml';

	/**
	 * Constructor
	 *
	 * @param string $themesPath
	 */
	public function __construct($themesPath, IOInterface $configSystem) {
		$this->fs = new Files($themesPath);
		$this->parser = $configSystem;
	}

	/**
	 * Get a page object with parsed content
	 *
	 * @param string $pageUID Page unique ID
	 * @throws IOException If the page does not exists
	 * @return Page Return the selected page
	 */
	public function read($themeName) {
		if (!$this->has($themeName)) {
			return false;
		}

		$path = $this->fs->getCWD() . $themeName . '/';

		if(!file_exists($path . self::$THEME_INFO_FILE)) {
			throw new NotFoundException('Invalid theme: `' . self::$THEME_INFO_FILE .
				'` does not exists for theme ` ' . $path . '`');
		}

		// Read theme config
		$infos = $this->parser->read($path . self::$THEME_INFO_FILE);

		return new Theme($path, $infos);
	}

	/**
	 * Check if a theme exists
	 *
	 * @param string $themeName
	 * @return bool If the theme exists
	 */
	public function has($themeName) {
		return $this->fs->exists($themeName);
	}

	/**
	 * List themes
	 *
	 * @return array
	 */
	public function index() {
		return $this->fs->index(); // TODO no recusrion
	}

	public function update($theme, $data) {
		return false;
	}

	public function create($data) {
		return false;
	}

	public function delete($data) {
		return false;
	}
}